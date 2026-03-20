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
2. Choose the MOST relevant Action ID.
   - "revenue", "sales", "how much" -> TOTAL_REVENUE.
   - "volume", "count", "how many" -> TRANSACTION_VOLUME.
   - "top" + "devices" -> TOP_DEVICES_REVENUE.
   - "high value", "above [amount]", "expensive" -> HIGH_VALUE_XNS.
   - "list", "records", "individual" (without threshold) -> LIST_TOP_TRANSACTIONS.
3. Extract parameters carefully:
   - timeRange: e.g. "jan 2025", "last week".
   - threshold: MUST BE A JSON NUMBER (e.g. 5000).
   - limit: MUST BE A JSON NUMBER (e.g. 10).
4. If it's a data question but NO Action ID fits, use "DYNAMIC_QUERY".
5. For pure greetings, use "UNKNOWN".

CRITICAL: Never return numbers as strings.

EXAMPLES:
Q: "List transactions above 5000 last month" -> {"actionId": "HIGH_VALUE_XNS", "parameters": {"threshold": 5000, "timeRange": "last month"}}
Q: "show me transactions for device box_123 yesterday" -> {"actionId": "DYNAMIC_QUERY", "parameters": {"timeRange": "yesterday"}}

QUESTION: "${question}"

RESPONSE FORMAT (JSON ONLY):
{
  "actionId": "STRING",
  "parameters": {
    "timeRange": "string or null",
    "threshold": number or null,
    "limit": number or null,
    "merchant": "string or null"
  },
  "reasoning": "short explanation"
}
JSON:`;
};

module.exports = { getActionDispatcherPrompt };
