function getSummaryPrompt(question, analyticsData) {
  const metric = analyticsData?.valueKey || "metric";
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];

  const kpis = (analyticsData?.kpis || [])
    .map((k) => `- ${k.name}: ${k.value}`)
    .join("\n");

  const trend = (analyticsData?.chartData || [])
    .map((p) => `[${p.label}: ${p.value}]`)
    .join(", ");

  const isCurrency =
    metric.toLowerCase().includes("revenue") ||
    metric.toLowerCase().includes("amount") ||
    metric.toLowerCase().includes("amt");

  return `TASK: Summarize the following data in 1-2 concise, professional sentences.

CONTEXT:
- Today's Date: ${dateStr}
- User Question: "${question}"

DATA POINTS:
- Metric Type: ${metric} (${isCurrency ? "Currency INR" : "Numeric Count"})
- Key Statistics:
${kpis || "None"}
- Data Series/Trend:
${trend || "None"}

STRICT GROUNDING RULES:
1. DO NOT invent or change dates/years. Use exactly what is in the DATA POINTS (e.g., if it says 2026, do not output 2023).
2. ONLY mention values provided. If the data is empty, say "No data found for this query."
3. If money: Use ₹ prefix. Format with Indian numbering if possible (e.g. ₹1,50,000).
4. Do not guess names for IDs. Use the IDs directly.
5. Absolute honesty: If you identify a drop or peak, mention the specific label (date/ID).

SUMMARY:`;
}

module.exports = { getSummaryPrompt };
