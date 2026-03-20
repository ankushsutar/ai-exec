const { dispatchAction } = require("./backend/src/services/ai/actionDispatcher");

async function runTests() {
  const tests = [
    "Which 5 devices have the most transactions",
    "Show volume for UPI vs Card transactions"
  ];

  for (const q of tests) {
    console.log(`\n--- Testing: "${q}" ---`);
    try {
      const result = await dispatchAction(q);
      console.log(`Action: ${result.capabilityId}`);
      console.log(`Params: ${JSON.stringify(result.parameters)}`);
      console.log(`Sample Result: ${JSON.stringify(result.results.slice(0, 2), null, 2)}`);
    } catch (err) {
      console.error(`Error: ${err.message}`);
    }
  }
}

runTests().catch(console.error);
