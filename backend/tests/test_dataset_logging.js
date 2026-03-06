const {
  logProductionQuery,
  getDataset,
} = require("../src/services/data/datasetService");
const fs = require("fs");
const path = require("path");

async function testLogging() {
  console.log("--- Testing Dataset Logging ---");
  const testQuestion = "Test question for logging " + Date.now();

  // Log a query
  logProductionQuery(testQuestion, "TEST_INTENT", { test: true });

  // Give it a moment to write if async (it's sync currently)
  const dataset = getDataset();
  const entry = dataset.find((e) => e.question === testQuestion);

  if (entry) {
    console.log(
      "✅ Success: Query logged correctly in backend/storage/dataset_log.json",
    );
    process.exit(0);
  } else {
    console.error("❌ Failure: Query not found in dataset log.");
    process.exit(1);
  }
}

testLogging();
