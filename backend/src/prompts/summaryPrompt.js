function getSummaryPrompt(question, analyticsData) {
  const sanitizedData = {
    kpis: analyticsData?.kpis || [],
    chartDataLength: analyticsData?.chartData?.length || 0,
  };

  return `You are an expert Data Analyst summarizing key metrics for an executive dashboard.
Your goal is to write ONE short, punchy paragraph explaining the data directly in a professional tone.

User Question: "${question}"

Data Provided:
${JSON.stringify(sanitizedData, null, 2)}

INSTRUCTIONS:
1. Write EXACTLY ONE concise paragraph summarizing the metrics above.
2. DO NOT write any headings, lists, or introductory phrases (like "Here is a summary" or "Task:"). Just the text.
3. DO NOT hallucinate any information not present in the Data Provided.
4. Keep the summary under 80 words.

SUMMARY:`;
}

module.exports = { getSummaryPrompt };
