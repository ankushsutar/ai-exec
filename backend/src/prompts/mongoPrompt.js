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

Instructions:
- Generate a valid MongoDB aggregation pipeline array.
- **CRITICAL: For SYSTEM SUMMARY on a specific day OR daily trends, use the "systemDailySummaryInfo" collection.**
- **CRITICAL: For OVERALL or LIFE-TIME SYSTEM SUMMARY (not filtered by date), use the "systemSummaryInfo" collection.**
- **CRITICAL: For REVENUE or VOLUME queries over time, use the "transactionActionHistoryInfo" collection.**
- **CRITICAL: When grouping by day, always add a final $project stage to flatten technical _id fields (e.g., { "$project": { "_id": 0, "date": "$_id.day", "revenue": "$revenue" } }) to ensure dates are visible in the UI table.**
- **CRITICAL: Revenue is the sum of the transaction amount field "txnAmt". DO NOT use "amount" or "totalRevenue".**
- **CRITICAL: When sorting/finding by "txnAmt", always add a $match stage first: { "txnAmt": { "$exists": true, "$ne": null } }.**
- **CRITICAL: For "highest" or "top" queries, sort by "txnAmt": -1. For "lowest" or "bottom" queries, sort by "txnAmt": 1. If a specific record or "the transaction" (singular) is asked, DO NOT use $group or $sum, simply use $sort and $limit: 1.**
- **CRITICAL: For "Trend" or daily grouping, use a $group stage with _id: { day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } }.**
- **CRITICAL: For ALL date/time filters (relative or absolute), YOU MUST wrap values in new Date(), e.g., { "createdAt": { "$gte": "new Date('2026-02-16T00:00:00.000Z')" } } or "new Date(Date.now() - ...)".**
- **CRITICAL: MANDATORY FILTER: For ALL queries on "transactionActionHistoryInfo", YOU MUST include "actionStatus": 1 in the first $match stage. No exceptions.**
- **CRITICAL: Heuristic: Even if the user says "all transactions", secretly filter for "actionStatus": 1.**
${filterContext._targetCollection ? `- **CRITICAL: YOU MUST USE THE COLLECTION "${filterContext._targetCollection}" for this query.**` : ""}

NEGATIVE CONSTRAINTS:
- **DO NOT** assume the existence of a "revenue" field. Sum "txnAmt" instead (ONLY if asked for total revenue).
- **DO NOT** ignore time constraints (like "last 7 days"). They MUST be the first $match stage.
- **DO NOT** use "transactionHistoryInfo" - it is deprecated.
- **CRITICAL: Never mix 0 (exclusion) and 1 (inclusion) in a $project stage.**
- **CRITICAL: Use a single "$" for document fields (e.g., "$amount").**
- If joining collections, use $lookup with "localField" and "foreignField".

OUTPUT FORMAT:
Return ONLY a JSON object with "collection" and "query" keys.
"query" is the aggregation pipeline array.

${COMMON_RULES}
`;
}

module.exports = { getMongoPrompt };
