const { generateSQLFromPrompt } = require("./sqlAgent");
const { executeDynamicQuery } = require("../data/dbService");
const { connect: connectMongo } = require("../data/mongoService");
const { generateMQLFromPrompt } = require("./mongoAgent");
const { dispatchIntent } = require("./intentDispatcher");
const { extractBIParams } = require("../analytics/biParamExtractor");

/**
 * The Intelligent Broker that orchestrates across Postgres and MongoDB.
 */
async function orchestrateHybridQuery(question, requestId) {
  console.log(`[Hybrid Broker] Orchestrating query for #${requestId}`);

  // STEP 1: Determine intent using LLM (Intelligent Dispatcher)
  const intentResult = await dispatchIntent(question);
  let intent = intentResult?.intent;

  if (!intentResult || intent === "UNKNOWN") {
    console.log(`[Hybrid Broker] Intent is UNKNOWN. Aborting execution.`);
    throw new Error("UNSUPPORTED_QUERY");
  }

  // STEP 2: Execute via Query Planner
  const { planAndExecute } = require("./queryPlanner");
  try {
    const results = await planAndExecute(question, intentResult);
    return results;
  } catch (error) {
    console.error(`[Hybrid Broker] Execution failed: ${error.message}`);
  }
}



module.exports = { orchestrateHybridQuery };
