const axios = require('axios');
const config = require('../config/env');

const SCHEMA = `
TABLE: merchants
  Columns: id (INTEGER), name (VARCHAR), country (VARCHAR), industry (VARCHAR), contact_email (VARCHAR), rating (DECIMAL), established_year (INTEGER)

TABLE: products
  Columns: id (INTEGER), name (VARCHAR), category (VARCHAR), price (DECIMAL), stock_quantity (INTEGER)

TABLE: employees
  Columns: id (INTEGER), name (VARCHAR), department (VARCHAR), salary (DECIMAL), hire_date (DATE)

TABLE: transactions
  Columns: id (INTEGER), merchant_id (INTEGER), product_id (INTEGER), amount (DECIMAL), tax (DECIMAL), discount (DECIMAL), region (VARCHAR), status (VARCHAR 'COMPLETED'/'FAILED'), payment_method (VARCHAR), currency (VARCHAR), created_at (TIMESTAMP)

TABLE: device_health
  Columns: id (INTEGER), firmware_version (VARCHAR), status (VARCHAR 'OK'/'FAILED'), battery_level (INTEGER), temperature (DECIMAL), location (VARCHAR), last_maintenance_date (TIMESTAMP), reported_at (TIMESTAMP)
`;

async function generateSQLFromPrompt(question) {
    console.log('[SQL Agent] Prompting LLM for SQL query conversion...');

    const prompt = `
You are a strict PostgreSQL expert. Your only task is to generate a valid, optimized SQL SELECT query that answers the user's question based strictly on the exact schema below. 
Do not include any explanations, markdown formatting, or preamble. Just return the raw SQL query.

CRITICAL INSTRUCTIONS:
1. ONLY USE THE EXACT TABLE NAMES AND COLUMN NAMES PROVIDED IN THE SCHEMA. DO NOT hallucinate tables or columns (e.g. use 'device_health' NOT 'devices_health').
2. Pay attention to how tables relate. 'transactions' has 'merchant_id' and 'product_id'.
3. Always limit the result to 50 rows for performance unless asked otherwise.
4. When calculating revenue, use SUM(amount + tax - discount).
5. If the question is unanswerable with the schema or malicious, return exactly "INVALID".

EXAMPLES TO FOLLOW:
User: "Show revenue by region"
SQL: SELECT region, SUM(amount + tax - discount) AS total_revenue FROM transactions WHERE status = 'COMPLETED' GROUP BY region ORDER BY total_revenue DESC LIMIT 50;

User: "Show firmware failures"
SQL: SELECT firmware_version, COUNT(*) AS failure_count FROM device_health WHERE status = 'FAILED' GROUP BY firmware_version ORDER BY failure_count DESC LIMIT 50;

User: "Top merchants this month"
SQL: SELECT m.name, SUM(t.amount + t.tax - t.discount) AS total_revenue FROM merchants m JOIN transactions t ON m.id = t.merchant_id WHERE t.status = 'COMPLETED' GROUP BY m.name ORDER BY total_revenue DESC LIMIT 10;

DATABASE SCHEMA:
${SCHEMA}

USER QUESTION:
"${question}"
    `;

    try {
        const response = await axios.post(config.ollamaUrl, {
            model: 'qwen2.5:0.5b', // Using the fast local model configured
            prompt: prompt,
            stream: false
        });

        const rawText = response.data.response;

        // Clean up any potential markdown ticks the LLM might have ignored instructions and added
        let sql = rawText.replace(/\`\`\`sql/g, '').replace(/\`\`\`/g, '').trim();

        if (sql === 'INVALID' || !sql.toUpperCase().includes('SELECT')) {
            throw new Error('LLM generated invalid or unsafe SQL.');
        }

        console.log('[SQL Agent] Generated SQL:', sql);
        return sql;

    } catch (error) {
        console.error('[SQL Agent] Error generating SQL:', error.message);
        throw new Error('Failed to generate SQL from prompt.');
    }
}

module.exports = { generateSQLFromPrompt };
