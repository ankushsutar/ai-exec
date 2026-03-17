function getSummaryPrompt(question, analyticsData) {
  const metric = analyticsData?.valueKey || "metric";
  const kpis = (analyticsData?.kpis || [])
    .map((k) => `- ${k.name}: ${k.value}`)
    .join("\n");
  const trend = (analyticsData?.chartData || [])
    .map((p) => `${p.label}=${p.value}`)
    .join(", ");

  const isCurrency =
    metric.toLowerCase().includes("revenue") ||
    metric.toLowerCase().includes("amount") ||
    metric.toLowerCase().includes("amt");

  return `TASK: Summarize the following data in ONE concise paragraph.

DATA:
- Metric: ${metric} (${isCurrency ? "Currency INR" : "Numeric Count"})
- Statistics:
${kpis}
- Trend: ${trend}

RULES:
1. ONLY talk about the labels and values provided above.
2. If money: Use INR/₹. Otherwise: No currency.
3. Be professional and direct. Max 3 sentences.
4. If labels are IDs (like 104085), DO NOT guess names. Use the IDs.

SUMMARY:`;
}

module.exports = { getSummaryPrompt };
