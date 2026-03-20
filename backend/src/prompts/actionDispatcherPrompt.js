/**
 * actionDispatcherPrompt.js
 */

const getActionDispatcherPrompt = (question, registry) => {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];

  return `
Task: Identify the ACTION and PARAMETERS for the user's question.

CURRENT DATE: ${dateStr}

REGISTRY:
${registry}

INSTRUCTIONS:
1. Examine the QUESTION and the REGISTRY.
2. If the question is UNRELATED to the Registry (e.g. weather, general knowledge, jokes, greetings), return "UNKNOWN".
3. Choose the MOST relevant Action ID if it's a data question.
   - "revenue", "sales", "how much" -> TOTAL_REVENUE.
   - "volume", "count", "how many" -> TRANSACTION_VOLUME.
   - "top" + "devices" -> TOP_DEVICES_REVENUE.
   - "high value", "above [amount]", "expensive" -> HIGH_VALUE_XNS.
   - "list", "records", "individual" (without threshold) -> LIST_TOP_TRANSACTIONS.
3. Extract parameters carefully:
   - timeRange: e.g. "jan 2025", "last week".
   - threshold: MUST BE A JSON NUMBER (e.g. 5000).
   - operator: "gt" (above/more), "lt" (below/less), "eq" (equal).
   - limit: MUST BE A JSON NUMBER.
   - metric: "revenue", "volume", "transactionCount", "latency", "avg_value".
   - dimension: "deviceId", "transactionMode", "hour", "day", "month".
  4. If the question asks for "daily", "monthly", or "trends", set the appropriate dimension ("day", "month"). 
  5. LIMITS: For rankings (e.g., "Top 5"), provide the limit. For trend dimensions ("day", "month", "hour"), OMIT the limit string to see the full period.
  6. If it's a data question but NO Action ID fits, use "DYNAMIC_QUERY".

EXAMPLES:
Q: "daily volume in jan 2026" -> {"actionId": "TRANSACTION_VOLUME", "parameters": {"metric": "transactionCount", "dimension": "day", "timeRange": "jan 2026", "limit": null}}
Q: "What is the capital of France?" -> {"actionId": "UNKNOWN", "parameters": {}}
Q: "devices with revenue less than 1,500,000" -> {"actionId": "TOP_DEVICES_REVENUE", "parameters": {"metric": "revenue", "dimension": "deviceId", "threshold": 1500000, "operator": "lt", "limit": 10}}
Q: "hourly trend today" -> {"actionId": "TRANSACTION_VOLUME", "parameters": {"metric": "transactionCount", "dimension": "hour", "timeRange": "today", "limit": null}}

QUESTION: "${question}"

RESPONSE FORMAT (JSON ONLY):
{
  "actionId": "STRING",
  "parameters": {
    "timeRange": "string or null",
    "threshold": number or null,
    "operator": "gt" | "lt" | "eq",
    "metric": "string or null",
    "dimension": "string or null",
    "limit": number or null,
    "merchant": "string or null"
  },
  "reasoning": "short explanation"
}
JSON:`;
};

module.exports = { getActionDispatcherPrompt };
