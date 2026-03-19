const axios = require("axios");
const config = require("../../config/env");
const { generateEmbedding } = require("./ollamaService");
const { getTopSchemasString } = require("../data/vectorStore");
const { getBestFewShotExample } = require("../knowledge/knowledgeBase");
const analyticsQueryLibrary = require("../analytics/analyticsQueryLibrary");
const { getLibraryMetadata } = require("../analytics/libraryRegistry");
const AI_CONFIG = require("../../config/aiConfig");

// DYNAMIC DATE EVALUATION
// Recursively walk the query object and convert "new Date(...)" strings to real Date objects
const evaluateDates = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(evaluateDates);
  } else if (obj instanceof Date) {
    return obj;
  } else if (obj !== null && typeof obj === "object") {
    const newObj = {};
    for (const [key, value] of Object.entries(obj)) {
      newObj[key] = evaluateDates(value);
    }
    return newObj;
  } else if (typeof obj === "string") {
    // 1. Match "new Date(...)" or "ISODate(...)"
    const dateMatch = obj.match(/^(new Date|ISODate)\((.*)\)$/i);
    if (dateMatch) {
      try {
        const expr = dateMatch[2].replace(/['"]/g, "");
        if (expr === "") return new Date();
        if (expr.includes("Date.now()")) {
          const ms = eval(expr.replace("Date.now()", Date.now()));
          return new Date(ms);
        }
        return new Date(expr);
      } catch (e) {
        return obj;
      }
    }

    // 2. Auto-detect ISO Date Strings (e.g. 2026-02-16T00:00:00.000Z)
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    if (isoRegex.test(obj)) {
      const d = new Date(obj);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return obj;
};

/**
 * Adaptive Parameter Mapping: Uses a fast LLM call to map user parameters (dates, limits, filters)
 * into a Golden Example's optimized structure.
 */
async function dynamicizeMQL(userQuestion, goldenExample) {
  const { model } = { model: AI_CONFIG.MODELS.MAPPING }; // Use centralized config

  const mappingPrompt = `
You are a Data Logic Mapper. 
Goal: Take a "Golden MQL Template" and update its SPECIFIC VALUES to match a "New Question".

GOLDEN QUESTION: "${goldenExample.question}"
GOLDEN MQL:
${goldenExample.content}

NEW USER QUESTION: "${userQuestion}"

INSTRUCTIONS:
1. Preserve the structure (stages, keys, operators) from the GOLDEN MQL.
2. Update ONLY the values to match the NEW USER QUESTION:
   - If a date (YYYY-MM-DD or relative like "today") is mentioned, update the $match dates.
   - If a number (like "10", "100") is mentioned in the context of a count or limit, update the $limit stage.
   - For example, if Golden Question has "last 7 days" and New Question has "last 30 days", update the subtraction math.
3. Return ONLY the JSON for the updated MQL.

UPDATED MQL JSON:`;

  try {
    const response = await axios.post(
      config.ollamaUrl,
      {
        model: model,
        prompt: mappingPrompt,
        stream: false,
        format: "json",
        options: { temperature: 0 },
      },
      { timeout: AI_CONFIG.TIMEOUTS.MAPPING },
    );

    return JSON.parse(response.data.response);
  } catch (e) {
    console.warn(
      "[Mongo Agent] Dynamic parameter mapping failed, using raw golden content.",
      e.message,
    );
    return JSON.parse(goldenExample.content);
  }
}

/**
 * Programmatic Safeguards: Ensures mandatory business rules (like actionStatus: 1)
 * are applied regardless of LLM output.
 */
function applyMandatorySafeguards(result) {
  if (!result.query || !Array.isArray(result.query)) return result;

  // 1. Force actionStatus: 1 for ALL transaction queries
  if (result.collection === "transactionActionHistoryInfo") {
    const matchStage = result.query.find((s) => s.$match);
    if (matchStage) {
      matchStage.$match.actionStatus = 1;
      
      // 1.1 Field Alias: AI often guesses "date", but schema uses "createdAt"
      if (matchStage.$match.date && !matchStage.$match.createdAt) {
        matchStage.$match.createdAt = matchStage.$match.date;
        delete matchStage.$match.date;
      }
    } else {
      result.query.unshift({ $match: { actionStatus: 1 } });
    }
  }

  // 2. Auto-add $limit if missing (already in main flow, but good here)
  const hasLimit = result.query.some((stage) => stage.$limit);
  if (!hasLimit) {
    result.query.push({ $limit: AI_CONFIG.DEFAULTS.LIMIT });
  }

  return result;
}

/**
 * Generates an MQL (MongoDB Aggregation Pipeline or find query) from a natural language prompt.
 * Optimized for high-volume transaction retrieval.
 */
async function generateMQLFromPrompt(
  question,
  filterContext = {},
  intentResult = {},
  requestId = "N/A",
) {
  console.log(
    `[Mongo Agent] [#${requestId}] Prompting LLM for MQL conversion...`,
  );

  let targetCollection = "transactionActionHistoryInfo";
  
  // UNIFIED INTENT HANDLING: Everything transaction or device-stat related is an ANALYTICS_QUERY
  if (intentResult.intent === "DEVICE_STATS_QUERY") {
    targetCollection = "deviceStatHistoryInfo";
  }

  let topSchemas = "";
  let fewShotExample = "";
  try {
    const questionEmbedding = await generateEmbedding(question);
    topSchemas = getTopSchemasString(questionEmbedding, question, 3, "mongodb");
    fewShotExample = getBestFewShotExample(questionEmbedding, "mql", 0.7);

    // LIBRARY BYPASS: If a pre-built library function is identified, use it
    if (intentResult.libraryFunction && analyticsQueryLibrary[intentResult.libraryFunction]) {
      console.log(`[Mongo Agent] Library Hit: Using pre-built pipeline "${intentResult.libraryFunction}"`);
      const libFn = analyticsQueryLibrary[intentResult.libraryFunction];
      
      const metadata = getLibraryMetadata(intentResult.libraryFunction);
      if (metadata) {
        targetCollection = metadata.collection;
      }

      // Handle functions that might need arguments dynamically using registry metadata
      let query;
      const entities = intentResult.entities || {};
      
      if (metadata && metadata.params && metadata.params.length > 0) {
        // Map extracted entities to the function parameters in the correct order
        // ES6 default parameters will trigger if the entity is undefined
        const args = metadata.params.map(param => entities[param]);
        query = libFn(...args);
      } else {
        query = typeof libFn === "function" ? libFn() : libFn;
      }

      // Merge filterContext if present (e.g. deviceIds)
      if (Object.keys(filterContext).length > 0) {
        if (query[0] && query[0].$match) {
          Object.assign(query[0].$match, filterContext);
        } else {
          query.unshift({ $match: filterContext });
        }
      }

      const result = {
        collection: targetCollection,
        query: evaluateDates(query)
      };

      return applyMandatorySafeguards(result);
    }
  } catch (e) {
    console.error("[Mongo Agent] Schema retrieval failed:", e.message);
    topSchemas = "Unknown Collection Schema";
  }

  const { getMongoPrompt } = require("../../prompts/mongoPrompt");
  const { routeModel } = require("./modelRouter");

  // GOLDEN EXAMPLE BYPASS: If we have an exact match (score > 0.85), use it directly
  if (fewShotExample && fewShotExample.score > 0.85) {
    // 1. Semantic Antonym Guard (Still needed to prevent highest vs lowest confusion)
    const opposites = [
      ["highest", "lowest"],
      ["top", "bottom"],
      ["max", "min"],
      ["maximum", "minimum"],
    ];
    let isOpposite = false;
    for (const [pos, neg] of opposites) {
      if (
        (question.toLowerCase().includes(pos) &&
          fewShotExample.question.toLowerCase().includes(neg)) ||
        (question.toLowerCase().includes(neg) &&
          fewShotExample.question.toLowerCase().includes(pos))
      ) {
        isOpposite = true;
        break;
      }
    }

    if (!isOpposite) {
      console.log(
        `[Mongo Agent] High-Confidence Golden Match found (${(fewShotExample.score * 100).toFixed(1)}%). Performing dynamic parameter mapping.`,
      );
      try {
        // DYNAMIC ADAPTATION: Map user dates/numbers into the golden template
        let result = await dynamicizeMQL(question, fewShotExample);

        // If we have filterContext (e.g. deviceIds), merge them into the first $match stage
        if (Object.keys(filterContext).length > 0) {
          if (result.query[0] && result.query[0].$match) {
            Object.assign(result.query[0].$match, filterContext);
          } else {
            result.query.unshift({ $match: filterContext });
          }
        }

        result = applyMandatorySafeguards(result);
        // Evaluate dates in the dynamically mapped MQL
        result.query = evaluateDates(result.query);

        console.log(
          `[Mongo Agent] Dynamic Bypass Success. Collection: ${result.collection}`,
        );
        return result;
      } catch (e) {
        console.warn(
          "[Mongo Agent] Dynamic mapping failed, falling back to LLM.",
          e.message,
        );
      }
    }
  }

  // Routing for full LLM generation
  const model = AI_CONFIG.MODELS.MQL_GEN;

  const prompt = getMongoPrompt(
    question,
    topSchemas,
    filterContext,
    fewShotExample,
    targetCollection,
  );

  try {
    const response = await axios.post(
      config.ollamaUrl,
      {
        model: model,
        prompt: prompt,
        stream: false,
        format: "json",
        options: {
          temperature: 0,
          top_k: 1,
          top_p: 0.1,
        },
      },
      { timeout: AI_CONFIG.TIMEOUTS.QUERY_GEN },
    ); // Increased to 60s for Llama 3.2

    let result = JSON.parse(response.data.response);

    // VALIDATION & ENHANCEMENT
    if (!result.query || !Array.isArray(result.query)) {
      throw new Error(
        "INVALID_PIPELINE: Mongo query must be an aggregation array.",
      );
    }

    // STRUCTURAL HARDENING: Ensure all stages are objects
    // FIX: Smarter pipeline repair
    const fixedQuery = [];
    for (let i = 0; i < result.query.length; i++) {
      let stage = result.query[i];

      if (typeof stage === "string" && stage.startsWith("$")) {
        // If the next element is an object that DOES NOT start with $, merge it
        const next = result.query[i + 1];
        if (
          next &&
          typeof next === "object" &&
          !Object.keys(next).some((k) => k.startsWith("$"))
        ) {
          fixedQuery.push({ [stage]: next });
          i++; // Skip the next one as we merged it
          continue;
        } else {
          // Empty stage case
          fixedQuery.push({ [stage]: {} });
        }
      } else if (typeof stage === "object") {
        // Ensure it's a valid stage object (has a $ key)
        if (!Object.keys(stage).some((k) => k.startsWith("$"))) {
          // If it's a naked object, wrap it in $match by default
          fixedQuery.push({ $match: stage });
        } else {
          fixedQuery.push(stage);
        }
      }
      // Ignore naked numbers/invalid types unless they match the previous stage logic
    }
    result.query = fixedQuery;

    // Auto-add $limit 50 if no limit stage exists
    const hasLimit = result.query.some((stage) => stage.$limit);
    if (!hasLimit) {
      result.query.push({ $limit: AI_CONFIG.DEFAULTS.LIMIT });
    }

    // POST-PROCESSING HEURISTICS
    let queryStr = JSON.stringify(result.query);

    // Fix: $$field -> $field (LLMs often confuse aggregation variables with document fields)
    queryStr = queryStr.replace(/\$\$(\w+)/g, (match, p1) => {
      const internalVars = [
        "NOW",
        "ROOT",
        "CURRENT",
        "DESCEND",
        "PRUNE",
        "KEEP",
        "REMOVE",
      ];
      return internalVars.includes(p1.toUpperCase()) ? match : `$${p1}`;
    });

    // Fix: "now()" -> "$$NOW"
    queryStr = queryStr.replace(/"now\(\)"/gi, '"$$$NOW"');

    result.query = JSON.parse(queryStr);

    result.collection = targetCollection;
    result = applyMandatorySafeguards(result);
    result.query = evaluateDates(result.query);
    
    console.log(`[Mongo Agent] Selected Collection: ${result.collection}`);
    console.log(
      "[Mongo Agent] Final Evaluated Query:",
      JSON.stringify(result.query),
    );
    return result;
  } catch (error) {
    console.error("[Mongo Agent] Error generating MQL:", error.message);
    throw new Error("Failed to generate MQL.");
  }
}

module.exports = { generateMQLFromPrompt, applyMandatorySafeguards };
