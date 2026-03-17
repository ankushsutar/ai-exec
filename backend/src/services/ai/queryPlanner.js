const { generateMQLFromPrompt } = require("./mongoAgent");
const { executeDynamicQuery } = require("../data/dbService");
const { runMongoQuery } = require("../data/mongoService");

/**
 * Orchestrates query execution based on intent classification.
 */
async function planAndExecute(question, intentResult) {
  const { intent, dataSources, entities, needsMerchantLookup } = intentResult;

  let context = {};

  // Step 1: Handle Merchant Metadata Lookup if required
  if (needsMerchantLookup || intent === "MERCHANT_QUERY" || entities.merchant) {
    console.log("[Query Planner] Performing Merchant metadata lookup in Postgres...");
    // Find deviceIds for the merchant
    const sql = `SELECT "deviceId" FROM "deviceRelationInfo" WHERE "merchantId" IN (SELECT id FROM "merchantInfo" WHERE "businessName" ILIKE '%${entities.merchant || ""}%')`;
    const results = await executeDynamicQuery(sql);
    
    if (results && results.length > 0) {
      context.deviceIds = results.map(r => r.deviceId);
      console.log(`[Query Planner] Found ${context.deviceIds.length} devices for merchant.`);
    }
  }

  // Step 2: Route to appropriate database
  if (intent === "MERCHANT_QUERY" && !dataSources.includes("mongo")) {
    const { generateSQLFromPrompt } = require("./sqlAgent");
    const sql = await generateSQLFromPrompt(question, intentResult);
    return await executeDynamicQuery(sql);
  }

  if (intent === "TRANSACTION_QUERY" || intent === "DEVICE_STATS_QUERY" || intent === "HYBRID_QUERY" || intent === "ANALYTICS_QUERY") {
    // If we have deviceIds, add them to filter context
    const filterContext = context.deviceIds ? { deviceId: { $in: context.deviceIds } } : {};
    
    const mqlResult = await generateMQLFromPrompt(question, filterContext, intentResult);
    return await runMongoQuery(mqlResult.collection, mqlResult.query);
  }

  return null;
}

module.exports = { planAndExecute };
