const { IDENT_PROMPT, COMMON_RULES } = require("./baseSystemPrompt");

function getMongoPrompt(question, schema, filterContext = {}) {
  const contextStr = Object.keys(filterContext).length
    ? `\nContext Filters: ${JSON.stringify(filterContext)}`
    : "";

  return `
${IDENT_PROMPT}

Collection Schema (MongoDB):
${schema}
${contextStr}

User Question:
${question}

Instructions:
- Generate a valid MongoDB aggregation pipeline array.
- Use $match, $group, $project, $sort appropriately.
- Handle nested field references correctly.
${COMMON_RULES}

IMPORTANT: Return a JSON object with "collection" and "query" keys.
"query" is the aggregation array.
`;
}

module.exports = { getMongoPrompt };
