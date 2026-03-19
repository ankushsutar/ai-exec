const { generateMQLFromPrompt } = require("../src/services/ai/mongoAgent");

async function verify() {
  // Test 1: Field Aliasing (Simulate LLM returning "date")
  const mockIntent = {
    intent: "ANALYTICS_QUERY",
    libraryFunction: null, // Force full MQL generation bypass
    entities: { year: 2025, month: 1 }
  };
  
  // We manually call the internal 'applyMandatorySafeguards' logic via a simulated result
  const { applyMandatorySafeguards } = require("../src/services/ai/mongoAgent");
  
  const mockResult = {
    collection: "transactionActionHistoryInfo",
    query: [
      { $match: { date: { $gte: "2025-01-01" } } },
      { $group: { _id: null, rev: { $sum: "$txnAmt" } } }
    ]
  };

  console.log("Input Query (with 'date' field):", JSON.stringify(mockResult.query));
  const fixed = applyMandatorySafeguards(mockResult);
  console.log("Fixed Query (should use 'createdAt'):", JSON.stringify(fixed.query));

  if (fixed.query[0].$match.createdAt && !fixed.query[0].$match.date) {
    console.log("✅ SUCCESS: Field 'date' aliased to 'createdAt'.");
  } else {
    console.log("❌ FAILURE: Aliasing failed.");
  }

  // Test 2: Mandatory actionStatus
  if (fixed.query[0].$match.actionStatus === 1) {
    console.log("✅ SUCCESS: actionStatus: 1 enforced.");
  } else {
    console.log("❌ FAILURE: actionStatus not enforced.");
  }
}

verify().catch(console.error);
