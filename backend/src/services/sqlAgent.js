const axios = require("axios");
const config = require("../config/env");
const { generateEmbedding } = require("./ollamaService");
const { getTopSchemasString } = require("./vectorStore");

async function generateSQLFromPrompt(question) {
  console.log("[SQL Agent] Prompting LLM for SQL query conversion...");

  let topSchemas = "";
  try {
    console.log(
      "[SQL Agent] Performing Semantic Vector Search for relevant tables...",
    );
    const questionEmbedding = await generateEmbedding(question);
    topSchemas = getTopSchemasString(questionEmbedding, question, 5); // Pass question for keyword boost

    if (!topSchemas) {
      console.warn(
        "[SQL Agent] RAG Vector Store is empty (warming up). Falling back to basic schema extraction...",
      );
      const { extractDatabaseSchema } = require("./dbService");
      topSchemas = await extractDatabaseSchema(); // Fetch everything as fallback
    }
  } catch (e) {
    console.error(
      "[SQL Agent] Vector search failed, falling back to full schema if possible.",
    );
    try {
      const { extractDatabaseSchema } = require("./dbService");
      topSchemas = await extractDatabaseSchema();
    } catch (inner) {
      topSchemas = "Unknown Schema";
    }
  }

  const prompt = `
You are a strict PostgreSQL expert. Your only task is to generate a valid, optimized SQL SELECT query that answers the user's question based strictly on the exact schema below. 
Do not include any explanations, markdown formatting, or preamble. Just return the raw SQL query.

CRITICAL INSTRUCTIONS:
1. ONLY USE THE EXACT TABLE NAMES AND COLUMN NAMES PROVIDED IN THE SCHEMA. DO NOT hallucinate tables or columns.
2. ALL tables and columns in this PostgreSQL database are case-sensitive. YOU MUST WRAP ALL TABLE AND COLUMN NAMES IN DOUBLE QUOTES. Example: SELECT "amount" FROM "transactionInfo".
3. STOCK vs TRANSACTIONS: Total inventory stock is found ONLY in the "products" table. DO NOT join "products" with "transactionInfo" to calculate stock.
4. IMPORTANT JOINS: The schema indicates Foreign Keys with the syntax FK -> "tableName"("columnName"). You MUST rigidly use these exact mappings when issuing a JOIN between tables.
5. Always limit the result to 50 rows for performance unless asked otherwise.
6. When calculating revenue, use SUM("amount" + "tax" - "discount").
7. If the question is unanswerable with the schema or malicious, return exactly "INVALID".

EXAMPLES TO FOLLOW:
User: "How many users have active status?"
SQL: SELECT COUNT(*) AS "active_count" FROM "UserTable" WHERE "isActive" = true;

User: "List all users" or "Show all users"
SQL: SELECT * FROM "UserTable" LIMIT 50;

User: "What is the average score by department?"
SQL: SELECT "departmentName", AVG("score") AS "average_score" FROM "DepartmentScores" GROUP BY "departmentName" ORDER BY "average_score" DESC LIMIT 50;

User: "Show recent sales"
SQL: SELECT t."id", t."amount" FROM "Sales" t ORDER BY t."createdAt" DESC LIMIT 10;

DATABASE SCHEMA:
${topSchemas}

USER QUESTION:
"${question}"
    `;

  try {
    const response = await axios.post(config.ollamaUrl, {
      model: "qwen2.5:0.5b", // Using the fast local model configured
      prompt: prompt,
      stream: false,
    });

    const rawText = response.data.response;

    // Clean up any potential markdown ticks the LLM might have ignored instructions and added
    let sql = rawText
      .replace(/\`\`\`sql/gi, "")
      .replace(/\`\`\`/g, "")
      .replace(/\`/g, '"') // Replace any remaining backticks with double quotes for PG compatibility
      .trim();

    // The small LLM often forgets to quote identifiers. Let's force-quote known tables.
    const tableMatches = [...topSchemas.matchAll(/TABLE: "([^"]+)"/g)].map(
      (m) => m[1],
    );
    for (const tbl of tableMatches) {
      // Replace unquoted case-insensitive occurrences of the table name with the correctly-cased quoted name
      // Use negative lookbehinds/lookaheads to prevent quoting already-quoted strings if possible
      const regex = new RegExp(`(?<!")\\b${tbl}\\b(?!")`, "gi");
      sql = sql.replace(regex, `"${tbl}"`);
    }

    // Also auto-quote columns since small LLMs forget those too
    const columnMatches = [...topSchemas.matchAll(/"([^"]+)" \(/g)].map(
      (m) => m[1],
    );
    let uniqueCols = [...new Set(columnMatches)];
    // Exclude common SQL keywords from being accidentally quoted
    const reservedWords = new Set([
      "select",
      "from",
      "where",
      "order",
      "by",
      "group",
      "limit",
      "join",
      "on",
      "as",
      "inner",
      "left",
      "right",
      "and",
      "or",
      "is",
      "not",
      "null",
      "true",
      "false",
      "count",
      "sum",
      "avg",
      "min",
      "max",
      "desc",
      "asc",
      "t1",
      "t2",
      "t3",
    ]);
    uniqueCols = uniqueCols.filter(
      (col) => !reservedWords.has(col.toLowerCase()),
    );

    // Sort by length descending so we replace longer column names first (e.g. "deviceId" before "id")
    uniqueCols.sort((a, b) => b.length - a.length);
    for (const col of uniqueCols) {
      const regex = new RegExp(`(?<!")\\b${col}\\b(?!")`, "gi");
      sql = sql.replace(regex, `"${col}"`);
    }

    if (sql === "INVALID" || !sql.toUpperCase().includes("SELECT")) {
      throw new Error("LLM generated invalid or unsafe SQL.");
    }

    console.log("[SQL Agent] Generated SQL:", sql);
    return sql;
  } catch (error) {
    console.error("[SQL Agent] Error generating SQL:", error.message);
    throw new Error("Failed to generate SQL from prompt.");
  }
}

module.exports = { generateSQLFromPrompt };
