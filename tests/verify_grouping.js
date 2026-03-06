const {
  dispatchIntent,
} = require("../backend/src/services/ai/intentDispatcher");

async function runTests() {
  console.log("--- Starting Intent Grouping Verification ---");

  const testCases = [
    {
      q: "show me the total revenue",
      expectedIntent: "MONGODB_BI_TOTAL_REV",
    },
    {
      q: "what is the success rate of transactions?",
      expectedIntent: "MONGODB_BI_SUCCESS_RATE",
    },
    {
      q: "which devices are active in last 24 hours?",
      expectedIntent: "MONGODB_BI_ACTIVE_24H",
    },
    {
      q: "give me a system summary",
      expectedIntent: "MONGODB_BI_SYSTEM_SUMMARY",
    },
    {
      q: "show revenue trend for last 30 days",
      expectedIntent: "MONGODB_BI_REV_TREND",
    },
  ];

  console.log(`Testing ${testCases.length} questions...\n`);

  for (let i = 0; i < testCases.length; i++) {
    const test = testCases[i];
    console.log(`[Test ${i + 1}/${testCases.length}] Testing: "${test.q}"`);
    try {
      const startTime = Date.now();
      const intent = await dispatchIntent(test.q);
      const duration = Date.now() - startTime;

      const status = intent === test.expectedIntent ? "✅ PASS" : "❌ FAIL";
      console.log(`   Result: ${intent} (Expected: ${test.expectedIntent})`);
      console.log(`   Status: ${status} (${duration}ms)\n`);
    } catch (error) {
      console.error(`   Error testing: "${test.q}"`, error.message);
    }
  }

  console.log("--- Verification Complete ---");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Critical Failure:", err);
  process.exit(1);
});
