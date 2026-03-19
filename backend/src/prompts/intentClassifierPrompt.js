/**
 * Intent Classifier Prompt
 * Used to categorize user questions into specific intents and data sources.
 */

const getIntentClassifierPrompt = (question, retrievedFunctions = "") => {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });

  return `
Task: Classify the user's question into one of the following INTENTS.
If it's an analytics or device-related question, also identify the CAPABILITY_ID.

CURRENT DATE: ${dateStr} (${dayName})

ALLOWED INTENTS:
1. ANALYTICS_QUERY: Queries about revenue, sales, success, counts, trends, or specific reports.
2. DEVICE_STATS_QUERY: Queries about device hardware, network, battery, storage, firmware.
3. MERCHANT_QUERY: Queries about a specific merchant's devices or info.
4. UNKNOWN: Everything else.

AVAILABLE CAPABILITIES:
${retrievedFunctions}

INSTRUCTIONS:
1. Determine the high-level Intent.
2. **CRITICAL: If the question is NOT related to business analytics, transactions, or hardware stats (e.g. "whats your name", "tell me a joke"), you MUST return Intent: "UNKNOWN".**
3. If Intent is ANALYTICS_QUERY or DEVICE_STATS_QUERY, pick the BEST matching Capability ID from the list above.
4. Extract merchant name if mentioned.

QUESTION: "${question}"

RESPONSE FORMAT (JSON ONLY):
{
  "reasoning": "short explanation",
  "intent": "ANALYTICS_QUERY" | "DEVICE_STATS_QUERY" | "MERCHANT_QUERY" | "UNKNOWN",
  "capabilityId": "string or null",
  "dataSources": ["mongo" | "postgres"],
  "entities": {
    "merchant": "string or null"
  }
}
JSON:`;
};

module.exports = { getIntentClassifierPrompt };
