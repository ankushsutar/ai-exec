const { orchestrateHybridQuery } = require("../src/services/ai/hybridBroker");

async function testMonthlyAnalytics() {
  console.log("--- Testing Monthly Analytics Accuracy & Date Inclusion ---");

  const queries = [
    {
      q: "Best performing device for Feb 2025",
      id: "test-month-accuracy",
    },
    {
      q: "Top devices by revenue",
      id: "test-date-inclusion",
    },
  ];

  for (const item of queries) {
    console.log(`\nTesting Query: "${item.q}"`);
    try {
      const results = await orchestrateHybridQuery(item.q, item.id);

      if (results && results.length > 0) {
        console.log(`✅ Success: Found ${results.length} results.`);
        console.log("Sample Result:", JSON.stringify(results[0], null, 2));

        if (results[0].date) {
          console.log("✅ Success: 'date' field present in result.");
        } else {
          console.warn("⚠️ Warning: 'date' field missing in result.");
        }

        // For the month query, verify it was caught by the correct intent if possible via logs
      } else {
        console.log("ℹ️ No results found (expected if no data for Feb 2025).");
      }
    } catch (error) {
      console.error("❌ Error during test:", error);
    }
  }
}

testMonthlyAnalytics();
