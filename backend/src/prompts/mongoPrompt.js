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

ALLOWED COLLECTIONS:
- transactionActionHistoryInfo  → all payment/revenue/transaction data.
  * DOCUMENT STAGES (by actionStatus):
    - actionStatus: 1  → "Sent" (Initial request). Contains "txnAmt" (Amount).
    - actionStatus: 10 → "Ack" (Acknowledge).
    - actionStatus: 20 → "Response" (Final result). Contains "audioPlayed" (1=Success, 20=Failed) and "tMsgTimeElapsed" (Latency).
  * CRITICAL FIELDS:
    - txnAmt: Transaction amount (sum this for revenue where actionStatus: 1).
    - audioPlayed: 1 for success, 20 for failure (check this in actionStatus: 20 documents).
    - deviceId: Unique ID of the device.

- systemSummaryInfo             → overall lifetime system totals
- systemDailySummaryInfo        → daily breakdown of system totals

Instructions:
- Generate a valid MongoDB aggregation pipeline array.
- **CRITICAL: For REVENUE or TRANSACTION counts, use "transactionActionHistoryInfo" with { "actionStatus": 1 }.**
- **CRITICAL: For SUCCESS RATE (Network), compare count of { "actionStatus": 20 } vs { "actionStatus": 1 }.**
- **CRITICAL: For SUCCESS RATE (Audio), check { "audioPlayed": 1 } in documents where { "actionStatus": 20 }.**
- **CRITICAL: Revenue = sum of "txnAmt" where { "actionStatus": 1 }. DO NOT use "amount" or "totalRevenue".**
- **CRITICAL: For "Latency" or "Delay", use average of "tMsgTimeElapsed" where { "actionStatus": 20 }.**
- **CRITICAL: When sorting/finding by "txnAmt", always add a $match stage first: { "txnAmt": { "$exists": true, "$ne": null } }.**
- **CRITICAL: For "highest" or "top" queries, sort by "txnAmt": -1. For "lowest", sort by "txnAmt": 1.**
- **CRITICAL: YOU MUST USE THE FIELD "createdAt" FOR ALL DATE FILTERS. DO NOT USE "date".**
- **CRITICAL: For ALL date/time filters, YOU MUST wrap values with new Date(). e.g., { "createdAt": { "$gte": "new Date('2026-02-16T00:00:00.000Z')" } }.**
- **CRITICAL: When grouping by day, always add a final $project stage to flatten technical _id fields (e.g., { "$project": { "_id": 0, "date": "$_id.day", "revenue": "$revenue" } }).**
${filterContext._targetCollection ? `- **CRITICAL: YOU MUST USE THE COLLECTION "${filterContext._targetCollection}" for this query.**` : ""}

NEGATIVE CONSTRAINTS:
- **DO NOT** assume the existence of a "revenue" field. Sum "txnAmt" instead.
- **DO NOT** use any collection not in the ALLOWED COLLECTIONS list above.
- **CRITICAL: Never mix 0 (exclusion) and 1 (inclusion) in a $project stage.**
- **CRITICAL: Use a single "$" for document fields (e.g., "$txnAmt").**

OUTPUT FORMAT:
Return ONLY a JSON object with "collection" and "query" keys.
"query" is the aggregation pipeline array.

${COMMON_RULES}
`;
}

module.exports = { getMongoPrompt };
