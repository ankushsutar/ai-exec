const { dispatchAction } = require("./backend/src/services/ai/actionDispatcher");

async function test() {
  const question = "daily transaction volume in jan 2026";
  console.log(`Testing: "${question}"`);
  const result = await dispatchAction(question);
  console.log("Result Action:", result.capabilityId);
  console.log("Result Params:", JSON.stringify(result.parameters, null, 2));
  console.log("Sample Results:", JSON.stringify(result.results.slice(0, 3), null, 2));
}

test().catch(console.error);
