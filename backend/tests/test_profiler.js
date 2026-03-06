const broker = require("./src/services/hybridBroker");
const profiler = require("./src/services/profilerService");
const fs = require("fs");
const path = require("path");

async function testProfiler() {
  console.log("--- Testing AI Observability ---");

  const testQueries = [
    { q: "What is total revenue?", id: "test-bi" },
    { q: "Which merchant owns device 114676100?", id: "test-sql" },
    { q: "What is the revenue for Starbuck?", id: "test-hybrid" },
  ];

  for (const item of testQueries) {
    console.log(`\nExecuting: "${item.q}"`);
    try {
      await broker.orchestrateHybridQuery(item.q, item.id);
    } catch (e) {
      console.error(`Query failed: ${e.message}`);
    }
  }

  console.log("\n--- Checking Metrics Storage ---");
  const stats = profiler.getStatsSummary();
  console.log("Stats Summary:", JSON.stringify(stats, null, 2));

  const METRICS_FILE = path.join(
    __dirname,
    "./storage/performance_metrics.json",
  );
  if (fs.existsSync(METRICS_FILE)) {
    const raw = JSON.parse(fs.readFileSync(METRICS_FILE, "utf8"));
    console.log(`Total entries in file: ${raw.length}`);
  } else {
    console.error("Metrics file NOT found!");
  }
}

testProfiler();
