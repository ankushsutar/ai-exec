const { processAnalytics } = require("./src/utils/analyticsEngine");

const mockData = [
  {
    _id: { day: "2026-03-01" },
    txnAmt: 1500,
  },
  {
    _id: { day: "2026-03-02" },
    txnAmt: 2500,
  },
];

console.log("--- Testing Flattening and INR Formatting ---");
const result = processAnalytics(mockData);

console.log("Columns:", JSON.stringify(result.columns));
console.log("Sample Row:", JSON.stringify(result.tableData[0]));
console.log("KPIs:", JSON.stringify(result.kpis, null, 2));

const hasDate =
  result.columns.includes("day") || result.columns.includes("date");
const hasFormattedAmt =
  result.tableData[0]._txnAmt_formatted.includes("₹") ||
  result.tableData[0]._txnAmt_formatted.includes("INR");

if (hasDate && hasFormattedAmt) {
  console.log("\nSUCCESS: Data flattened and INR formatting confirmed.");
} else {
  console.error("\nFAILURE: Checks failed.", { hasDate, hasFormattedAmt });
  process.exit(1);
}
