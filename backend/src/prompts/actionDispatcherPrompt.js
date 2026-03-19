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
   - threshold: The number if "above X" or "exceeding X" is mentioned.
   - limit: The count if "top N" or "first N" is mentioned.
4. If it's pure greeting/chitchat, use "UNKNOWN".

EXAMPLES:
Q: "List transactions above 5000 last month" -> {"actionId": "HIGH_VALUE_XNS", "parameters": {"threshold": 5000, "timeRange": "last month"}}
Q: "top 5 devices" -> {"actionId": "TOP_DEVICES_REVENUE", "parameters": {"limit": 5}}

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
