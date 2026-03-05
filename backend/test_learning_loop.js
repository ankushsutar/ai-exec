const broker = require("./src/services/hybridBroker");
const vectorStore = require("./src/services/vectorStore");

async function testLearningLoop() {
  console.log("--- Testing Autonomous Learning Loop ---");

  const question = "Show me the revenue per day for the last week";
  const id1 = "learn-1";
  const id2 = "learn-2";

  console.log(`\nRound 1 (Should be Agent Hit): "${question}"`);
  await broker.orchestrateHybridQuery(question, id1);

  console.log("\nWaiting a moment for storage to persist...");
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log(`\nRound 2 (Should be GOLDEN HIT): "${question}"`);
  await broker.orchestrateHybridQuery(question, id2);

  console.log("\n--- Verification Complete ---");
}

testLearningLoop();
