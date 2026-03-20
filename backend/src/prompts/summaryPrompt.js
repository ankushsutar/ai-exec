function getSummaryPrompt(question, analyticsData) {
  const metric = analyticsData?.valueKey || "metric";
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];

  const kpis = (analyticsData?.kpis || [])
    .map(k => `- ${k.label || k.name}: ${k.value}`)
    .join("\n");

  const trend = (analyticsData?.chartData || [])
    .map(d => `- ${d.date || d.label}: ${d.value}`)
    .join("\n");

  const isCurrency =
    metric.toLowerCase().includes("revenue") ||
    metric.toLowerCase().includes("amount") ||
    metric.toLowerCase().includes("amt");

  if (analyticsData?.intent === "UNKNOWN") {
    const list = (analyticsData?.systemCapabilities || [])
      .map(c => `- ${c}`)
      .join("\n");
    
    return `TASK: The user asked an out-of-scope or unanswerable question. Gracefully inform them that you are an AI Executive Intelligence specialized in Transaction Analytics.

USER QUESTION: "${question}"

AVAILABLE CAPABILITIES:
${list}

RESPONSE:
- Acknowledge their question.
- Politely explain that you cannot answer that specific query.
- Offer to help with the items in the AVAILABLE CAPABILITIES list above.
- Provide 2 example working prompts.

Concise 2-3 sentence response.
ASSISTANT:`;
  }

  // 1. Explicit No Data Case
  if (!kpis && !trend) {
    return `TASK: Politely inform the user that no records were found matching their analytical query for "${question}".
Suggest they try a broader time range or check if the filter (e.g. device ID) is correct.
Concise 1 sentence response.
ASSISTANT:`;
  }

  const timeRange = analyticsData?.parameters?.timeRange || "the requested period";
  const isTrend = (analyticsData?.chartData || []).length > 1;

  // 2. Data Present Case (Business Analyst Insight Mode)
  return `SYSTEM: You are a Senior Business Analyst. Your task is to provide a PRECISE, DATA-DRIVEN insight based ONLY on the provided dataset.

CONTEXT:
- User Query: "${question}"
- Reporting Period: ${timeRange}
- Comparison Data: NONE (Do NOT compare to past periods unless multiple months/years are listed below)

DATASET:
- Main Metric: ${isCurrency ? "Total Revenue (₹)" : "Transaction Volume (Count)"}
${kpis ? `\nGLOBAL AGGREGATES:\n${kpis}` : ""}
${isTrend ? `\nTEMPORAL DATA POINTS (TREND):\n${trend}` : ""}

INSIGHT GUIDELINES (STRICT):
1. NO HALLUCINATIONS: Do NOT invent growth percentages, historical averages, or "previous year" comparisons. Only report on the data provided in the GLOBAL AGGREGATES and TEMPORAL DATA POINTS lists.
2. NO PERIOD CONFUSION: The "Reporting Period" is ${timeRange}. If the dataset contains individual dates, those are just timestamps—do NOT say the total is for a specific day if the user asked for a year.
3. STRUCTURE: 
   ${isTrend 
     ? `- Summarize the total for ${timeRange} and identify the PEAK and TROUGH points within the trend.` 
     : `- State the overall total for ${timeRange} as a definitive aggregate.`
   }
4. TONE: Professional, objective, and ultra-concise. No "fluff" or conversational intro.
5. NO TECHNICAL LEAKAGE: Do NOT use phrases like "Metric: Numeric Count" or "Target Metric". 

ANALYST INSIGHT:`;
}

module.exports = { getSummaryPrompt };
