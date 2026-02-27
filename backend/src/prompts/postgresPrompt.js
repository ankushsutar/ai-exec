const { IDENT_PROMPT, COMMON_RULES } = require("./baseSystemPrompt");

function getPostgresPrompt(question, schema) {
  return `
${IDENT_PROMPT}

Database Schema (PostgreSQL):
${schema}

User Question:
${question}

Instructions:
- Generate a syntactically correct PostgreSQL SELECT query.
- Use proper JOIN conditions if multiple tables required.
- Quote identifiers using double quotes.
- Prefer explicit columns over SELECT *.
${COMMON_RULES}

Return only the SQL query.
`;
}

module.exports = { getPostgresPrompt };
