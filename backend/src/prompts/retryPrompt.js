const { IDENT_PROMPT, COMMON_RULES } = require("./baseSystemPrompt");

function getRetryPrompt(question, failedQuery, errorMessage) {
  return `
${IDENT_PROMPT}

The previous query failed.

User Question:
${question}

Failed Query:
${failedQuery}

Database Error:
${errorMessage}

Instructions:
- Analyze the error and correct the query.
- Ensure all identifiers match the schema provided previously.
${COMMON_RULES}

Return the corrected query only.
`;
}

module.exports = { getRetryPrompt };
