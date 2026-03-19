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
   - If it mentions "revenue", "sales", "how much" -> TOTAL_REVENUE.
   - If it mentions "volume", "count", "how many" -> TRANSACTION_VOLUME.
   - If it asks for "top" or "best" and "devices" -> TOP_DEVICES_REVENUE.
   - If it asks for specific "transactions" or "individual records" -> LIST_TOP_TRANSACTIONS.
3. Extract parameters carefully.
4. If it's a greeting or completely unrelated, use "UNKNOWN".

EXAMPLES:
Q: "total revenue jan 2025" -> {"actionId": "TOTAL_REVENUE", "parameters": {"timeRange": "jan 2025", "limit": 10}}
Q: "list top 5 transactions last week" -> {"actionId": "LIST_TOP_TRANSACTIONS", "parameters": {"timeRange": "last week", "limit": 5}}

QUESTION: "${question}"

RESPONSE FORMAT (JSON ONLY):
{
  "actionId": "STRING",
  "parameters": {
    "timeRange": "string or null",
    "limit": number,
    "merchant": "string or null"
  },
  "reasoning": "short explanation"
}
JSON:`;
};

module.exports = { getActionDispatcherPrompt };
