const { orchestrateHybridQuery } = require("./src/services/hybridBroker.js");
const { initializeKnowledgeBase } = require("./src/services/knowledgeBase.js");

async function testUniversalIntelligence() {
  await initializeKnowledgeBase();

  const scenarios = [
    { name: "User Revenue", q: "show revenue for user Ankush" },
  ];

  console.log("--- Testing Universal Entity Intelligence (Simplified) ---");

  for (const scenario of scenarios) {
    console.log(`\nScenario: ${scenario.name}`);
    console.log(`Question: "${scenario.q}"`);

    try {
      const result = await orchestrateHybridQuery(scenario.q, "TEST_ID");
      console.log(`Successfully orchestrated! Result Count: ${result.length}`);
      if (result.length > 0) {
        console.log(`Entity Name Sample: ${result[0].entityName}`);
        console.log(
          `Sample Data: ${JSON.stringify(result[0]).slice(0, 100)}...`,
        );
      }
    } catch (e) {
      console.error(`Orchestration failed: ${e.message}`);
    }
  }
}

testUniversalIntelligence().catch(console.error);
