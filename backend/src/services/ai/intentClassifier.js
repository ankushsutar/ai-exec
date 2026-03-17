const axios = require("axios");
const config = require("../../config/env");
const { getBestFewShotExample } = require("../knowledge/knowledgeBase");
const { generateEmbedding } = require("./ollamaService");

/**
 * Classifies a user question into specific intents and data sources.
 * Returns structured JSON with intent, dataSources, and entities.
 */
async function classifyIntent(question) {
  const lowercaseQ = question.toLowerCase();
  
  // HEURISTIC SAFETY VALVE: Reject non-transactional technical probing early
  const telemetryKeywords = ["battery", "signal", "reboot", "firmware", "config", "mode"];
  const analyticKeywords = ["summary", "overall", "metrics", "revenue", "transaction", "sales"];
  
  const isTelemetry = telemetryKeywords.some(kw => lowercaseQ.includes(kw));
  const isAnalytic = analyticKeywords.some(kw => lowercaseQ.includes(kw));
  const isCollectionProbe = lowercaseQ.includes("info") || lowercaseQ.includes("collection");
  
  if (isTelemetry && !isAnalytic) {
    console.log(`[Intent Classifier] Early rejection: Non-transactional keyword detected.`);
    return {
      reasoning: "Heuristic rejection: detected telemetry keyword without analytic context.",
      intent: "UNKNOWN",
      dataSources: ["mongo"],
      entities: {},
      needsMerchantLookup: false
    };
  }

  try {
    const { generateIntent } = require("./ollamaService");
    
    console.log(`[Intent Classifier] Classifying question: "${question}"`);
    const result = await generateIntent(question);
    
    console.log(`[Intent Classifier] Classified: ${result.intent} on ${JSON.stringify(result.dataSources)}`);
    return result;
  } catch (error) {
    console.error("[Intent Classifier] Classification failed:", error.message);
    return {
      intent: "UNKNOWN",
      dataSources: ["postgres"],
      entities: {},
      needsMerchantLookup: false
    };
  }
}

module.exports = { classifyIntent };
