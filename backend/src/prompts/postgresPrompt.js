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
- **NEGATIVE CONSTRAINT: Never use the "transactionInfo", "transactions", or "payments" tables.** These only exist in MongoDB.
- **NEGATIVE CONSTRAINT: Do not guess columns like "revenue", "amount", or "pnl" in SQL.** These metrics are in MongoDB.
- Generate a syntactically correct PostgreSQL SELECT query.
- Quote ALL table and column identifiers using double quotes (e.g., "tableName"."columnName").
- **CRITICAL: Always use short, explicit aliases for tables (e.g., FROM "merchantInfo" AS m) and prefix ALL columns with that alias (e.g., m."id").**
- Use ILIKE for case-insensitive searches.
- Use TO_CHAR(column, 'YYYY-MM-DD') for date formatting.
${COMMON_RULES}

Return ONLY the SQL query.
`;
}

module.exports = { getPostgresPrompt };
