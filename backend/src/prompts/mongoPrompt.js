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
- **CRITICAL: For REVENUE or VOLUME queries, always use the "transactionActionHistoryInfo" collection.**
- **CRITICAL: Revenue is the sum of the transaction amount field "txnAmt". DO NOT use "amount" or "totalRevenue".**
- **CRITICAL: When sorting/finding by "txnAmt", always add a $match stage first: { "txnAmt": { "$exists": true, "$ne": null } }.**
- **CRITICAL: For "highest" or "top" queries, sort by "txnAmt": -1. If "the transaction" (singular) is asked, use $limit: 1.**
- **CRITICAL: For "Trend" or daily grouping, use a $group stage with _id: { day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } }.**
- **CRITICAL: For "last X days" or relative time filters, YOU MUST include a $match stage with { "createdAt": { "$gt": "new Date(Date.now() - X*24*60*60*1000)" } }.**
- **CRITICAL: Heuristic: Unless otherwise specified, filter for "actionStatus": 1 to ensure only successful/valid records are considered.**

NEGATIVE CONSTRAINTS:
- **DO NOT** assume the existence of a "revenue" field. Sum "txnAmt" instead.
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
