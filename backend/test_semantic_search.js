const { classifyIntent } = require("./src/services/intentClassifier");

async function testSemanticSearch() {
  console.log("--- Testing Semantic Search Improvements ---");

  const testCases = [
    "I want to see the volume for merchant Starbuck",
    "Which device has the lowest battery?",
    "Show me active users for today",
  ];

  for (const q of testCases) {
    console.log(`\nQuestion: "${q}"`);
    const result = await classifyIntent(q);
    console.log(
      `Result: Entity=${result?.entity}, Intent=${result?.intent}, Confidence=${result?.confidence}`,
    );
  }
}

testSemanticSearch();
