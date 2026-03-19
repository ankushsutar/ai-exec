const { planAndExecute } = require("./queryPlanner");

/**
 * The Intelligent Broker that orchestrates across Postgres and MongoDB (V3).
 */
async function orchestrateHybridQuery(question, requestId) {
  console.log(`[Hybrid Broker] Orchestrating query for #${requestId}`);

  try {
    // V3 Architecture: Unified Planning and Execution
    const results = await planAndExecute(question);
    
    if (!results || (Array.isArray(results) && results.length === 0)) {
      console.log(`[Hybrid Broker] No results for #${requestId}.`);
    }

    return results;
  } catch (error) {
    console.error(`[Hybrid Broker] Orchestration failed for #${requestId}: ${error.message}`);
    throw error;
  }
}

module.exports = { orchestrateHybridQuery };
