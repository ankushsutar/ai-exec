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

    if (result.actionId === "UNKNOWN") {
      return { intent: "UNKNOWN", results: [] };
    }

    // 2. NORMALIZE DATE RANGE
    const range = normalizeDateRange(result.parameters.timeRange);
    console.log(`[Action Dispatcher] Normalized Range: ${range.start?.toISOString()} to ${range.end?.toISOString()}`);

    // 3. EXECUTE CAPABILITY
    const capability = getCapabilityById(result.actionId);
    if (!capability) {
      console.warn(`[Action Dispatcher] Capability not found in registry: ${result.actionId}`);
      return { intent: "UNKNOWN", results: [] };
    }

    const libFn = analyticsQueryLibrary[capability.libraryFunction];
    if (typeof libFn !== "function") {
      throw new Error(`Library function ${capability.libraryFunction} not found`);
    }

    // Map parameters based on registry definition
    const args = capability.params.map(p => {
      if (p === "timeRange") return range;
      return result.parameters[p] || null;
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
