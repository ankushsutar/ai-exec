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
  const isTrend = analyticsData?.isTrend;
  const isCategorical = analyticsData?.isCategorical;

  const dataset = `TIME PERIOD: ${timeRange}
METRIC TYPE: ${isCurrency ? "Currency (₹)" : "Count"}
AGGREGATE DATA:
${kpis || "N/A"}`;

  const requestId = analyticsData?.requestId || "0000";

  return `### SESSION ID: ${requestId} ###
SYSTEM: You are a Senior Data Analyst. Provide a short, accurate summary of the CURRENT_DATA_BLOCK below. 

CURRENT_DATA_BLOCK:
- Query: "${question}"
- Reporting Period: ${timeRange}
- Metric Type: ${isCurrency ? "CURRENCY (₹)" : "TRANSACTION_COUNT (NUMBER)"}

CURRENT_AGGREGATES:
${kpis || "N/A"}

${(isTrend || isCategorical) ? `\nTEMPORAL/CATEGORICAL BREAKDOWN:\n${trend}` : ""}

STRICT INSTRUCTIONS:
1. ONLY USE the numbers under "CURRENT_DATA_BLOCK". 
2. DO NOT use numbers from previous queries or your own memory.
3. COPY-PASTE figure strings exactly. Do not round or convert to "millions".
4. If the Metric Type is TRANSACTION_COUNT, do NOT add a ₹ symbol.
5. Summarize the results in 1-2 professionally toned sentences.
6. USE EXACT NUMBERS: Use the exact value strings from the data (e.g. "₹11,99,94,46,715" or "7,917,924"). 
7. DO NOT SCALE: Do not convert numbers to "millions", "billions", "lakhs", or "crores". 
8. DO NOT HALLUCINATE: Only mention values shown in the data.

ANALYST SUMMARY:`;
}

module.exports = { getSummaryPrompt };
