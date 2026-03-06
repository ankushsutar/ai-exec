const { IDENT_PROMPT, COMMON_RULES } = require("./baseSystemPrompt");

function getMongoPrompt(question, schema, filterContext = {}, fewShot = null) {
  const contextStr = Object.keys(filterContext).length
    ? `\nContext Filters: ${JSON.stringify(filterContext)}`
    : "";

  const fewShotStr = fewShot
    ? `\nFEW-SHOT EXAMPLE:\nQuestion: ${fewShot.question}\nAnswer: ${fewShot.content}\n`
    : "";

  return `
${IDENT_PROMPT}

Collection Schema (MongoDB):
${schema}
${contextStr}
${fewShotStr}

User Question:
${question}

ALLOWED COLLECTIONS (use ONLY these):
- transactionActionHistoryInfo  → all payment/revenue/transaction data (field: txnAmt for amount, actionStatus: 1 for valid)
- systemSummaryInfo             → overall lifetime system totals
- systemDailySummaryInfo        → daily breakdown of system totals
- deviceStatHistoryInfo         → device telemetry: uptime, battery, signal, firmware (linking key: metadata.deviceId)
- deviceModeHistoryInfo         → device mode changes over time
- deviceNetworkInfo             → network operator, signal strength, RSRP, RSSI
- deviceEventLogHistoryInfo     → device event logs (errors, reboots, config changes)
- deviceConnectivityMonthlyInfo → monthly device online/offline status
- deviceConnectivityMonthlyHistoryInfo → historical monthly connectivity records
- deviceConnectivityHistoryInfo → per-event connectivity changes
- deviceConfigHistoryInfo       → device configuration change history
- advertisementActionHistoryInfo → advertisement delivery and action tracking
- userSummaryInfo               → user-level summary and login activity

Instructions:
- Generate a valid MongoDB aggregation pipeline array.
- **CRITICAL: For SYSTEM SUMMARY on a specific day OR daily trends, use "systemDailySummaryInfo".**
- **CRITICAL: For OVERALL or LIFE-TIME SYSTEM SUMMARY (not filtered by date), use "systemSummaryInfo".**
- **CRITICAL: For REVENUE or TRANSACTION queries, use "transactionActionHistoryInfo". Revenue field = "txnAmt" (NOT "amount" or "revenue").**
- **CRITICAL: For DEVICE HEALTH, UPTIME, BATTERY, FIRMWARE, REBOOTS, SIGNAL, use "deviceStatHistoryInfo".**
- **CRITICAL: For NETWORK OPERATOR or SIGNAL queries, use "deviceNetworkInfo" or "deviceStatHistoryInfo".**
- **CRITICAL: When querying "deviceStatHistoryInfo", YOU MUST use "metadata.deviceId" to filter by device, NOT "deviceId".**
- **CRITICAL: When grouping by day, always add a final $project stage to flatten technical _id fields (e.g., { "$project": { "_id": 0, "date": "$_id.day", "revenue": "$revenue" } }).**
- **CRITICAL: Revenue = sum of "txnAmt". DO NOT use "amount" or "totalRevenue".**
- **CRITICAL: When sorting/finding by "txnAmt", always add a $match stage first: { "txnAmt": { "$exists": true, "$ne": null } }.**
- **CRITICAL: For "highest" or "top" queries, sort by "txnAmt": -1. For "lowest", sort by "txnAmt": 1.**
- **CRITICAL: For "Trend" or daily grouping, use $group with _id: { day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } }.**
- **CRITICAL: For ALL date/time filters, YOU MUST wrap values with new Date(). e.g., { "createdAt": { "$gte": "new Date('2026-02-16T00:00:00.000Z')" } }.**
- **CRITICAL: MANDATORY FILTER: For ALL queries on "transactionActionHistoryInfo", YOU MUST include "actionStatus": 1 in the first $match stage. For success verification, also filter for "audioPlayed": 1.**
${filterContext._targetCollection ? `- **CRITICAL: YOU MUST USE THE COLLECTION "${filterContext._targetCollection}" for this query.**` : ""}

NEGATIVE CONSTRAINTS:
- **DO NOT** assume the existence of a "revenue" field. Sum "txnAmt" instead.
- **DO NOT** ignore time constraints (like "last 7 days"). They MUST be the first $match stage.
- **DO NOT** use "transactionHistoryInfo" — it is DEPRECATED and does not exist.
- **DO NOT** use any collection not in the ALLOWED COLLECTIONS list above.
- **CRITICAL: Never mix 0 (exclusion) and 1 (inclusion) in a $project stage.**
- **CRITICAL: Use a single "$" for document fields (e.g., "$txnAmt").**
- **CRITICAL: Do NOT use "deviceId" in "deviceStatHistoryInfo"; use "metadata.deviceId" instead.**

OUTPUT FORMAT:
Return ONLY a JSON object with "collection" and "query" keys.
"query" is the aggregation pipeline array.

${COMMON_RULES}
`;
}

module.exports = { getMongoPrompt };
