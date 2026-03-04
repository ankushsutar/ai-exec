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

  return `You are a professional Data Analyst summarizing dashboard metrics.
User Question: "${question}"

DATA TO SUMMARIZE:
Primary Metric Name: ${metric}
Metric Type: ${isCurrency ? "Currency (INR)" : "Numeric Count"}
Key Statistics:
${kpis}

Trend Data (Label=Value):
${trend}

INSTRUCTIONS:
1. Write EXACTLY ONE concise paragraph summarizing the findings.
2. **IMPORTANT:** Only use Indian Currency (INR or ₹) if the Primary Metric represents money (Revenue, Amount).
3. If the Primary Metric is "Volume" or "Count", DO NOT use currency symbols. Report them as plain numbers.
4. Call out specific dates/labels and their actual values from the data.
5. DO NOT hallucinate. Only use the values provided above.
6. Focus on the "${metric}" trend.

SUMMARY:`;
}

module.exports = { getSummaryPrompt };
