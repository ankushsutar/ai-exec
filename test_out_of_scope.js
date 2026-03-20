const { dispatchAction } = require("./backend/src/services/ai/actionDispatcher");

async function test() {
  const question = "What is the capital of France?";
  console.log(`Testing: "${question}"`);
  const result = await dispatchAction(question);
  console.log("Result Intent:", result.intent);
  console.log("System Capabilities:", result.systemCapabilities);
}

test().catch(console.error);
