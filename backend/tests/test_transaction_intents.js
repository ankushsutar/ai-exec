/**
 * Transaction Intent Classifier Tester
 * Verifies that the simplified prompt correctly identifies transaction queries.
 */
const { classifyIntent } = require("../src/services/ai/intentClassifier");

const testQuestions = [
  "Show overall system summary", 
  "Top 5 devices by revenue in Jan 2025",
  "Total revenue today",
  "Revenue trend for the last 30 days",
  "Which device made the most money in Jan 2025?",
  "How many transactions yesterday?",
  "Show me battery levels", // Should be UNKNOWN
  "Current system config", // Should be UNKNOWN
];

async function runTests() {
  console.log("Starting Transaction Intent Classification Tests...\n");

  for (const question of testQuestions) {
    try {
      const result = await classifyIntent(question);
      console.log(`Question:  "${question}"`);
      console.log(`Reasoning: ${result.reasoning || "N/A"}`);
      console.log(`Intent:    ${result.intent}`);
      console.log(`Library:   ${result.libraryFunction || "None"}`);
      console.log(`Entities:  ${JSON.stringify(result.entities)}`);
      console.log("-".repeat(40));
    } catch (error) {
      console.error(`Error testing "${question}":`, error.message);
    }
  }
}

runTests();
