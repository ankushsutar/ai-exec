const { dispatchAction } = require("./actionDispatcher");
const { executeDynamicQuery } = require("./sqlAgent");

/**
 * planAndExecute
 * Main entry point for query planning and execution.
 */
async function planAndExecute(question) {
  console.log(`[Query Planner] Planning for question: "${question}"`);

  // 1. UNIFIED ACTION DISPATCHER (v3)
  // Replaces IntentClassifier and CapabilityEngine double-hop
  const actionResult = await dispatchAction(question);
  
  if (actionResult.intent === "ANALYTICS_QUERY" && actionResult.results?.length > 0) {
    console.log(`[Query Planner] Analytics Success: ${actionResult.capabilityId}`);
    return actionResult;
  }

  // 2. MERCHANT OR FAIL-OVER LOGIC
  // If analytics failed or it was a merchant query, handle SQL lookups
  const { merchant } = actionResult.parameters || {};

  if (merchant || actionResult.intent === "MERCHANT_QUERY") {
    console.log("[Query Planner] Performing Merchant metadata lookup...");
    const sql = `SELECT "deviceId" FROM "deviceRelationInfo" WHERE "merchantId" IN (SELECT "merchantId" FROM "merchantInfo" WHERE "merchantBusinessName" ILIKE '%${merchant || ""}%' OR "merchantLegalName" ILIKE '%${merchant || ""}%')`;
    const results = await executeDynamicQuery(sql);
    
    if (results && results.length > 0) {
      console.log(`[Query Planner] Found ${results.length} specific devices for merchant: ${merchant}`);
      // Return these if no analytics results exist
      if (!actionResult.results || actionResult.results.length === 0) {
        actionResult.results = results;
      }
    }
  }

  return actionResult;
}

module.exports = { planAndExecute };
