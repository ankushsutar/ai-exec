const { dispatchAction } = require("./backend/src/services/ai/actionDispatcher");

async function test() {
  try {
    const question = "show me the devices which has revenue less than 1500000";
    console.log(`Testing: "${question}"`);
    const result = await dispatchAction(question);
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Test Error:", err);
  }
}

test().catch(console.error);
