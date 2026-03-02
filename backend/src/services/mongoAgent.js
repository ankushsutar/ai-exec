const axios = require("axios");
const config = require("../config/env");
const { generateEmbedding } = require("./ollamaService");
const { getTopSchemasString } = require("./vectorStore");
const { getBestFewShotExample } = require("./knowledgeBase");

// DYNAMIC DATE EVALUATION
// Recursively walk the query object and convert "new Date(...)" strings to real Date objects
const evaluateDates = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(evaluateDates);
  } else if (obj !== null && typeof obj === "object") {
    const newObj = {};
    for (const [key, value] of Object.entries(obj)) {
      newObj[key] = evaluateDates(value);
    }
    return newObj;
  } else if (typeof obj === "string") {
    // Match "new Date(...)" or "ISODate(...)"
    const dateMatch = obj.match(/^(new Date|ISODate)\((.*)\)$/i);
    if (dateMatch) {
      try {
        // Safe evaluation of the date expression
        const expr = dateMatch[2].replace(/['"]/g, "");
        if (expr === "") return new Date();
        // Handle math expressions like Date.now() - ...
        if (expr.includes("Date.now()")) {
          const ms = eval(expr.replace("Date.now()", Date.now()));
          return new Date(ms);
        }
        return new Date(expr);
      } catch (e) {
        console.warn("[Mongo Agent] Date eval failed for:", obj);
        return obj;
      }
    }
  }
  return obj;
};

/**
 * Generates an MQL (MongoDB Aggregation Pipeline or find query) from a natural language prompt.
 * Optimized for high-volume transaction retrieval.
 */
async function generateMQLFromPrompt(
  question,
  filterContext = {},
  requestId = "N/A",
) {
  console.log(
    `[Mongo Agent] [#${requestId}] Prompting LLM for MQL conversion...`,
  );

  let topSchemas = "";
  let fewShotExample = "";
  try {
    const questionEmbedding = await generateEmbedding(question);
    topSchemas = getTopSchemasString(questionEmbedding, question, 3, "mongodb");
    fewShotExample = getBestFewShotExample(questionEmbedding, "mql", 0.7);
  } catch (e) {
    console.error("[Mongo Agent] Schema retrieval failed:", e.message);
    topSchemas = "Unknown Collection Schema";
  }

  const concepts = require("../config/concepts.json");

  const { getMongoPrompt } = require("../prompts/mongoPrompt");
  const { routeModel } = require("./modelRouter");

  // Routing with options:
  // - If we have a very weak few-shot, we might want a stronger model.
  const { model } = routeModel(question, {
    forceLlama: !fewShotExample || fewShotExample.score < 0.6,
    engine: "mongodb",
  });

  // GOLDEN EXAMPLE BYPASS: If we have an exact match (score > 0.85), use it directly
  if (fewShotExample && fewShotExample.score > 0.85) {
    // Prevent false positives on opposite semantic words (lowest vs highest) due to high embedding similarity
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

    // Numeric & Temporal Guard: Prevent bypass if the numbers differ (e.g., 7 vs 30)
    // or if the time periods differ (e.g., week vs month)
    const qNums = (question.match(/\d+/g) || []).join(",");
    const gNums = (fewShotExample.question.match(/\d+/g) || []).join(",");

    let bypassNumbers = qNums === gNums;
    // Allow equivalence for week/7, month/30
    if (qNums === "7" && fewShotExample.question.toLowerCase().includes("week"))
      bypassNumbers = true;
    if (
      qNums === "30" &&
      fewShotExample.question.toLowerCase().includes("month")
    )
      bypassNumbers = true;

    if (!bypassNumbers) {
      isOpposite = true;
    }

    const tempWords = ["day", "week", "month", "year", "today", "yesterday"];
    const qTemps = tempWords.filter((w) => question.toLowerCase().includes(w));
    const gTemps = tempWords.filter((w) =>
      fewShotExample.question.toLowerCase().includes(w),
    );

    let bypassTemps = qTemps.join(",") === gTemps.join(",");
    if (qNums === "7" && gTemps.includes("week")) bypassTemps = true;
    if (qNums === "30" && gTemps.includes("month")) bypassTemps = true;

    if (!bypassTemps) {
      isOpposite = true;
    }

    if (!isOpposite) {
      console.log(
        `[Mongo Agent] High-Confidence Golden Match found (${(fewShotExample.score * 100).toFixed(1)}%). Bypassing LLM.`,
      );
      try {
        let result = JSON.parse(fewShotExample.content);

        // If we have filterContext (e.g. deviceIds), merge them into the first $match stage
        if (Object.keys(filterContext).length > 0) {
          if (result.query[0] && result.query[0].$match) {
            Object.assign(result.query[0].$match, filterContext);
          } else {
            result.query.unshift({ $match: filterContext });
          }
        }

        // Evaluate dates in the golden example
        result.query = evaluateDates(result.query);

        return result;
      } catch (e) {
        console.warn(
          "[Mongo Agent] Failed to parse Golden Example, falling back to LLM.",
        );
      }
    }
  }

  const prompt = getMongoPrompt(
    question,
    topSchemas,
    filterContext,
    fewShotExample,
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
      { timeout: 60000 },
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
      result.query.push({ $limit: 50 });
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

module.exports = { generateMQLFromPrompt };
