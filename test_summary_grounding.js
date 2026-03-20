const { getSummaryPrompt } = require("./backend/src/prompts/summaryPrompt");

function test() {
  const question = "Total revenue for Dec 2025";
  const analytics = {
    valueKey: "totalRevenue",
    kpis: [{ label: "Total Revenue", value: "₹88,09,12,161" }, { label: "Count", value: "567,247" }],
    chartData: [{ label: "2025-12", value: "880912161" }]
  };

  const prompt = getSummaryPrompt(question, analytics);
  console.log("--- Generated Prompt for DATA PRESENT ---");
  console.log(prompt);
  
  const emptyAnalytics = { kpis: [], chartData: [] };
  const emptyPrompt = getSummaryPrompt(question, emptyAnalytics);
  console.log("\n--- Generated Prompt for NO DATA ---");
  console.log(emptyPrompt);
}

test();
