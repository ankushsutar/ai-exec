const { classifyIntent } = require("./intentClassifier");

/**
 * Uses LLM-driven intent classification.
 */
async function dispatchIntent(question) {
  const startTime = Date.now();
  try {
    console.log(`[Intent Dispatcher] Incoming Question: "${question}"`);
    console.log(`[Intent Dispatcher] Stage 1: Classification...`);
    
    const intentResult = await classifyIntent(question);
    
    const duration = Date.now() - startTime;
    console.log(`[Intent Dispatcher] Stage 1 Complete in ${duration}ms. Intent: ${intentResult.intent}`);
    
    return {
      ...intentResult,
      _metrics: {
        classificationTime: duration
      }
    };
  } catch (error) {
    console.error("[Intent Dispatcher] Stage 1 FAILED:", error.message);
    return {
      intent: "UNKNOWN",
      dataSources: ["postgres"],
      entities: {},
      needsMerchantLookup: false,
      _error: error.message
    };
  }
}

module.exports = { dispatchIntent };
