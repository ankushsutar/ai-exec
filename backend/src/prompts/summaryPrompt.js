const { IDENT_PROMPT } = require("./baseSystemPrompt");

function getSummaryPrompt(question, analyticsData) {
  const sanitizedData = {
    kpis: analyticsData?.kpis || [],
    chartDataLength: analyticsData?.chartData?.length || 0,
  };

  return `
${IDENT_PROMPT}
You are acting as a sharp Data Analyst.

User Question: "${question}"
Key Metrics: ${JSON.stringify(sanitizedData)}

Task:
1. Provide a concise factual summary of the KEY METRICS.
2. DO NOT hallucinate attributes or risks not in the data.
3. Keep word count under 80 words.
`;
}

module.exports = { getSummaryPrompt };
