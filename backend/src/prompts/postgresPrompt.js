const { IDENT_PROMPT, COMMON_RULES } = require("./baseSystemPrompt");

function getPostgresPrompt(question, schema) {
  return `
${IDENT_PROMPT}

Database Schema (PostgreSQL):
${schema}

CORE RELATIONSHIPS (STRICT JOIN PATTERNS):
- "merchantInfo"."merchantId" -> "merchantRelationInfo"."merchantId" (Both are VARCHAR. DO NOT join on "merchantInfo"."id" which is a BIGINT).
- "merchantRelationInfo"."relationId" -> "deviceRelationInfo"."relationId" (Both are BIGINT).
- ALWAYS JOIN these three to link Merchants to Devices.

User Question:
${question}

Instructions:
- **ARCHITECTURAL ROLE: RELATIONAL MAPPING ONLY.**
- **Rule 1: Use SQL ONLY for mapping Merchants to Devices.**
- **Rule 2: SELECT only columns from "merchantInfo", "merchantRelationInfo", and "deviceRelationInfo".**
- **Rule 3: NEVER attempt to calculate revenue, sum transaction amounts, or count transactions in SQL.** These belong in MongoDB.
- **Rule 4: Quote ALL table and column identifiers using double quotes.** (e.g., "tableName"."columnName").
- **Rule 5: ALWAYS use aliases (e.g., FROM "merchantInfo" AS m) and prefix columns with aliases (e.g., m."merchantId"). NEVER use a naked column name.**
- **Rule 6: Use ILIKE for case-insensitive searches.**

POSITIVE MAPPING PATTERN:
To find deviceIds for a merchant:
SELECT dr."deviceId" 
FROM "merchantInfo" m 
JOIN "merchantRelationInfo" mr ON m."merchantId" = mr."merchantId" 
JOIN "deviceRelationInfo" dr ON mr."relationId" = dr."relationId"
WHERE m."merchantBusinessName" ILIKE '%...%'

Return ONLY the SQL query.
`;
}

module.exports = { getPostgresPrompt };
