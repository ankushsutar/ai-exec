const { IDENT_PROMPT, COMMON_RULES } = require("./baseSystemPrompt");

function getPostgresPrompt(question, schema) {
  return `
${IDENT_PROMPT}

Database Schema (PostgreSQL):
${schema}

CORE RELATIONSHIPS — VERIFIED JOIN PATTERNS:

PATH 1 — Merchant to Physical Device (most common):
  "merchantInfo"."merchantId" -> "merchantRelationInfo"."merchantId"
  "merchantRelationInfo"."relationId" -> "deviceRelationInfo"."relationId"
  "deviceRelationInfo"."deviceId" = the deviceId used in MongoDB collections

PATH 2 — Merchant to Terminal ID (payment endpoint):
  "merchantInfo"."merchantId" -> "merchantRelationInfo"."merchantId"
  "merchantRelationInfo"."relationId" -> "terminalRelationInfo"."relationId"
  "terminalRelationInfo"."terminalId" = the logical payment TID

PATH 3 — User to Devices (via group hierarchy):
  "userInfo"."id" -> "userGroupInfo"."userId"
  "userGroupInfo"."groupId" -> "groupInfo"."id"
  "groupInfo"."id" -> "deviceIdentInfo"."groupId"

KEY RULES:
  - "merchantInfo"."merchantId" is VARCHAR (do NOT join on "merchantInfo"."id", which is BIGINT)
  - The shared key between all relation tables is "relationId"

User Question:
${question}

Instructions:
- **ARCHITECTURAL ROLE: RELATIONAL MAPPING ONLY — return IDs for MongoDB lookups.**
- **Rule 1: SELECT only columns from whitelisted Postgres tables: userInfo, userGroupInfo, merchantInfo, merchantRelationInfo, deviceRelationInfo, terminalRelationInfo, deviceBriefInfo, deviceIdentInfo, groupInfo, groupHierarchyInfo.**
- **Rule 2: NEVER calculate revenue, sum txnAmt, or count transactions in SQL.** These belong in MongoDB.
- **Rule 3: Quote ALL table AND column identifiers using double quotes. THIS IS MANDATORY for CamelCase columns.** (e.g., SELECT "firstName" FROM "userInfo").**
- **Rule 4: Quote all aliases as well (e.g., FROM "userInfo" AS "u").**
- **Rule 5: ALWAYS use aliases and prefix all columns with aliases. NEVER use a naked column name.**
- **Rule 6: Use ILIKE for case-insensitive name searches.**

POSITIVE MAPPING PATTERN — Merchant to Device IDs:
SELECT dr."deviceId"
FROM "merchantInfo" m
JOIN "merchantRelationInfo" mr ON m."merchantId" = mr."merchantId"
JOIN "deviceRelationInfo" dr ON mr."relationId" = dr."relationId"
WHERE m."merchantBusinessName" ILIKE '%...%'

Return ONLY the SQL query.
`;
}

module.exports = { getPostgresPrompt };
