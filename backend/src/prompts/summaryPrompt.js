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

  // 2. Data Present Case (Executive Insight Mode)
  return `TASK: Provide a high-level EXECUTIVE INSIGHT based on the following data in 1-2 professional sentences.

CONTEXT:
- Today's Date: ${dateStr}
- User Question: "${question}"

DATA POINTS:
- Metric: ${metric} (${isCurrency ? "Currency INR" : "Numeric Count"})
${kpis ? `\nGLOBAL STATISTICS:\n${kpis}` : ""}
${trend ? `\nTREND / TIME-SERIES DATA:\n${trend}` : ""}

STRICT INSIGHT RULES:
1. GO BEYOND the table: Do not just list the values. Identify the PEAK value/date, or mention if there is a notable growth/drop.
2. If it's a trend: Mention which period (day/month) was the strongest.
3. Keep it brief: No generic intros like "I have analyzed...". Start directly with the insight.
4. Professional Grounding: Use exactly the numbers and dates provided. If money: Use ₹ prefix.
5. If the user asked "Why", and no reason is obvious, stick to identifying the data patterns.

EXECUTIVE INSIGHT:`;
}

module.exports = { getSummaryPrompt };
