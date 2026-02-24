const axios = require("axios");
const config = require("../config/env");

async function generateTableSummary(tableName, schemaText) {
    const prompt = `
You are a Business Intelligence Analyst.
Analyze the following PostgreSQL table schema and sample data.
Provide a one-sentence summary explaining the business purpose of this table.
Do not include technical details like "it has an id column". Focus on what it helps a business leader understand.

TABLE NAME: "${tableName}"
SCHEMA:
${schemaText}

SUMMARY:
`;

    try {
        const response = await axios.post(config.ollamaUrl, {
            model: "qwen2.5:0.5b",
            prompt: prompt,
            stream: false,
        });

        return response.data.response.trim();
    } catch (error) {
        console.error(`[Schema Analyzer] Error generating summary for ${tableName}:`, error.message);
        return "Core business data table.";
    }
}

module.exports = { generateTableSummary };
