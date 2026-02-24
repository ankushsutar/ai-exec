const { generateSQLFromPrompt } = require('./src/services/sqlAgent');
const { executeDynamicQuery } = require('./src/services/dbService');
const { clearStore, addTableEmbedding } = require('./src/services/vectorStore');
const { generateEmbedding } = require('./src/services/ollamaService');
const { extractDatabaseSchema } = require('./src/services/dbService');

async function test() {
    console.log("--- Starting Verification ---");

    // 1. Manually populate vector store (simulating warmup/indexing)
    console.log("Indexing tables with deep analysis...");
    const tables = ['employees', 'products', 'transactions', 'merchants', 'device_health'];
    const { extractDatabaseSchema } = require('./src/services/dbService');
    const { generateTableSummary } = require('./src/services/schemaAnalyzer');
    for (const table of tables) {
        try {
            const schema = await extractDatabaseSchema([table]);
            const summary = await generateTableSummary(table, schema);
            const embedding = await generateEmbedding(table);
            addTableEmbedding(table, schema, embedding, summary);
            console.log(`- ${table} indexed. Summary: "${summary}"`);
        } catch (e) {
            console.error(`Error indexing ${table}:`, e.message);
        }
    }

    const testCases = [
        "which employee has the highest salary",
        "find products in the top price range"
    ];

    for (const question of testCases) {
        console.log(`\nTesting Question: "${question}"`);
        try {
            const sql = await generateSQLFromPrompt(question);
            console.log(`Generated SQL: ${sql}`);
            const results = await executeDynamicQuery(sql);
            console.log("Results count:", results.length);
        } catch (e) {
            console.error("Execution failed:", e.message);
        }
    }

    process.exit(0);
}

test();
