/**
 * Intent Classifier Prompt
 * Used to categorize user questions into specific intents and data sources.
 */

const getIntentClassifierPrompt = (question) => {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });

  return `
Task: Classify the user's question into one of the following INTENTS for an AI Analytics platform.

CURRENT DATE: ${dateStr} (${dayName})
PRIMARY COLLECTION: "transactionActionHistoryInfo" (Revenue, Sales, Success Rates)

ALLOWED INTENTS:
1. TRANSACTION_QUERY: Queries about revenue, sales, success, or transaction counts.
2. ANALYTICS_QUERY: Specific reports (Top devices by revenue, trends, hourly distribution, system summaries).
3. UNKNOWN: EVERYTHING ELSE.

STRICT MAPPING RULES:
- "trend" or "graph" -> getRevenueTrendPerDay
- "top" or "highest revenue" -> getTopDevicesByRevenue
- "revenue" + "today/yesterday" -> getSystemSummary
- "how many transactions" or "count" -> getDailyTransactionVolume
- "success rate" or "failure" -> getTransactionSuccessRate
- "average value" -> getAverageTransactionValue

PREBUILT FUNCTIONS:
- getSystemSummary (Used for overall totals and revenue today)
- getRevenueTrendPerDay (Used for trends and graphs)
- getTopDevicesByRevenue (Used for ranking devices by money)
- getDailyTransactionVolume (Used for transaction counts)
- getTransactionSuccessRate (Used for success % and failure)
- getAverageTransactionValue (Used for avg txn amount)
- getHighestRevenueDeviceByMonth (Used for monthly top device)

EXAMPLES:
- "Overall system summary" -> { "reasoning": "User wants a general overview.", "intent": "ANALYTICS_QUERY", "libraryFunction": "getSystemSummary" }
- "Revenue trend 30 days" -> { "reasoning": "User wants a revenue graph/trend.", "intent": "ANALYTICS_QUERY", "libraryFunction": "getRevenueTrendPerDay", "entities": { "days": 30 } }
- "How many transactions yesterday?" -> { "reasoning": "User wants a count of transactions.", "intent": "TRANSACTION_QUERY", "libraryFunction": "getDailyTransactionVolume", "entities": { "days": 1 } }
- "Which device made most money Jan 2025?" -> { "reasoning": "User wants the top device for a specific month.", "intent": "ANALYTICS_QUERY", "libraryFunction": "getHighestRevenueDeviceByMonth", "entities": { "year": 2025, "month": 1 } }

QUESTION: "${question}"

RESPONSE FORMAT (JSON ONLY):
{
  "reasoning": "short explanation",
  "intent": "TRANSACTION_QUERY" | "ANALYTICS_QUERY" | "UNKNOWN",
  "libraryFunction": "string or null",
  "dataSources": ["mongo"],
  "entities": {
    "year": number or null,
    "month": number or null,
    "days": number or null,
    "limit": number or null
  }
}
JSON:`;
};

module.exports = { getIntentClassifierPrompt };
