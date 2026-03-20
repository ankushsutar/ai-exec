/**
 * actionDispatcher.js
 * 
 * Unified entry point for analytical and merchant queries.
 * Replaces IntentClassifier and CapabilityEngine double-hop.
 */

const axios = require("axios");
const config = require("../../config/env");
const AI_CONFIG = require("../../config/aiConfig");
const { CAPABILITIES, getCapabilityById } = require("../analytics/capabilityRegistry");
const { normalizeDateRange } = require("../../utils/dateNormalizer");
const analyticsQueryLibrary = require("../analytics/analyticsQueryLibrary");
const { runMongoQuery } = require("../data/mongoService");
const { getActionDispatcherPrompt } = require("../../prompts/actionDispatcherPrompt");
const { generateMQLFromPrompt } = require("./mongoAgent");

async function dispatchAction(question) {
  console.log(`[Action Dispatcher] Processing: "${question}"`);

  // 1. SELECT ACTION & EXTRACT PARAMS (Single LLM Call)
  const registryStr = CAPABILITIES.map(c => `- ${c.id}: ${c.description}`).join("\n");
  console.log(`[Action Dispatcher] Registry Length: ${CAPABILITIES.length} items`);
  const prompt = getActionDispatcherPrompt(question, registryStr);

  try {
    const response = await axios.post(config.ollamaUrl, {
      model: AI_CONFIG.MODELS.CLASSIFIER,
      prompt: prompt,
      format: "json",
      stream: false,
      options: { temperature: 0 }
    }, { timeout: 45000 });

    const result = JSON.parse(response.data.response);
    console.log(`[Action Dispatcher] Selected Action: ${result.actionId} with Params:`, JSON.stringify(result.parameters));


    // 2. NORMALIZE DATE RANGE
    const range = normalizeDateRange(result.parameters.timeRange);
    console.log(`[Action Dispatcher] Normalized Range: ${range.start?.toISOString()} to ${range.end?.toISOString()}`);

    // 3. EXECUTE CAPABILITY
    let capability = getCapabilityById(result.actionId);
    
    // Explicitly handle UNKNOWN (Out of Scope)
    if (result.actionId === "UNKNOWN") {
      console.log(`[Action Dispatcher] Query is out-of-scope (UNKNOWN). Returning capability guide.`);
      return { 
        intent: "UNKNOWN", 
        results: [], 
        systemCapabilities: [
          "Revenue Analysis (Totals, Trends, Daily/Monthly)",
          "Transaction Volume (Counts, by Mode, by Device)",
          "Device Performance (Best/Worst devices, Failures)",
          "Technical Metrics (Audio Latency, Success Rates)"
        ]
      };
    }

    // FALLBACK: If DYNAMIC_QUERY, use mongoAgent to generate query
    if (!capability || result.actionId === "DYNAMIC_QUERY") {
      console.log(`[Action Dispatcher] No pre-built capability for "${result.actionId}". Falling back to Ad-hoc Analyst...`);
      try {
        const dynamicResult = await generateMQLFromPrompt(question, {}, { intent: "ANALYTICS_QUERY" });
        const data = await runMongoQuery(dynamicResult.collection, dynamicResult.query);
        
        return {
          intent: "ANALYTICS_QUERY",
          capabilityId: "AD_HOC_GENERATION",
          results: data,
          parameters: result.parameters,
          generatedQuery: dynamicResult.query
        };
      } catch (genError) {
        console.error("[Action Dispatcher] Ad-hoc generation failed:", genError.message);
        return { 
          intent: "UNKNOWN", 
          results: [], 
          systemCapabilities: [
            "Revenue Analysis",
            "Transaction Volume",
            "Device Performance"
          ]
        };
      }
    }

    const libFn = analyticsQueryLibrary[capability.libraryFunction];
    if (typeof libFn !== "function") {
      throw new Error(`Library function ${capability.libraryFunction} not found`);
    }

    // Map parameters based on registry definition
    const args = capability.params.map(p => {
      if (p === "timeRange") return range;
      // If the parameter is missing or null, use undefined to let the library's default take over
      const val = result.parameters[p];
      if (val === null || val === undefined || val === "null" || val === "") {
        return undefined;
      }
      return val;
    });

    const pipeline = libFn(...args);
    console.log(`[Action Dispatcher] Generated Pipeline:`, JSON.stringify(pipeline));
    const collection = "transactionActionHistoryInfo"; // Default for now
    
    const data = await runMongoQuery(collection, pipeline);
    return {
      intent: "ANALYTICS_QUERY",
      capabilityId: result.actionId,
      results: data,
      parameters: result.parameters
    };

  } catch (error) {
    console.error("[Action Dispatcher] Dispatch failed:", error.message);
    return { intent: "UNKNOWN", error: error.message };
  }
}

module.exports = { dispatchAction };
