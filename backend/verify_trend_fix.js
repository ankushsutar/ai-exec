const { processAnalytics } = require("./src/utils/analyticsEngine");

const mockTrendData = [
  { day: "2026-02-25", volume: 13076, totalRevenue: 20482094 },
  { day: "2026-02-26", volume: 3, totalRevenue: 270 },
];

console.log("--- Testing Metric Prioritization (Revenue vs Volume) ---");
const result = processAnalytics(mockTrendData);

console.log("Primary KPI Generated:", result.kpis[0].name);
console.log("Highest Label:", result.kpis[1].value);

const revenuePrioritized = result.kpis[0].name
  .toLowerCase()
  .includes("revenue");
const correctHighest = result.kpis[1].value === "2026-02-25";

if (revenuePrioritized && correctHighest) {
  console.log("✅ SUCCESS: Revenue prioritized over Volume.");
} else {
  console.error("❌ FAILURE: Incorrect metric prioritization.", {
    revenuePrioritized,
    correctHighest,
  });
  process.exit(1);
}

console.log("\n--- Verifying Chart Data Presence for Summary ---");
if (result.chartData && result.chartData.length === 2) {
  console.log("✅ SUCCESS: Chart data generated correctly for trend analysis.");
} else {
  console.error("❌ FAILURE: Missing chart data.");
  process.exit(1);
}
