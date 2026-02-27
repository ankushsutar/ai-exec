const axios = require("axios");
const config = require("../config/env");
const { generateEmbedding } = require("./ollamaService");
const { getTopSchemasString } = require("./vectorStore");
const { getBestFewShotExample } = require("./knowledgeBase");

async function generateSQLFromPrompt(question, originalQuestion = null) {
  console.log("[SQL Agent] Prompting LLM for SQL query conversion...");

  let topSchemas = "";
  let fewShotExample = "";
  const searchKey = originalQuestion || question;

  try {
    console.log(
      `[SQL Agent] Performing Semantic Vector Search using key: "${searchKey.substring(0, 50)}..."`,
    );
    const questionEmbedding = await generateEmbedding(searchKey);
    topSchemas = getTopSchemasString(
      questionEmbedding,
      searchKey,
      10,
      "postgres",
    );

    // Filter out "transactionInfo" from topSchemas to prevent hallucination in SQL
    topSchemas = topSchemas
      .split("\n\n")
      .filter((s) => !s.includes('TABLE: "transactionInfo"'))
      .join("\n\n");

    fewShotExample = getBestFewShotExample(questionEmbedding);

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

  const concepts = require("../config/concepts.json");

  const prompt = `
You are a PostgreSQL expert. Generate ONLY the raw SQL query to answer the user's question using ONLY the provided schema.

BUSINESS CONCEPTS:
- Mapping Path: ${concepts.relationships[0].path}
- Key Logic: ${concepts.relationships[0].description}
- Terminology: ${JSON.stringify(concepts.aliases)}

STRICT RULES:
1. RETURN ONLY RAW SQL. No markdown.
2. TRANSACTION DATA PROHIBITED: "transactionInfo" is off-limits.
3. JOINS: Use "merchantRelationInfo" -> "terminalRelationInfo".
4. MANDATORY: Use "terminalId" as the final device identifier.

STRICT RULES:
1. Use ONLY these tables: ${
    topSchemas
      .match(/TABLE: "([^"]+)"/g)
      ?.map((t) => t.replace("TABLE: ", ""))
      .join(", ") || "NONE PROVIDED"
  }
2. DO NOT hallucinate tables like "product", "sales", or "products".
3. Wrap ALL table/column names in double quotes. Example: SELECT "amount" FROM "transactionInfo".
4. Follow foreign key relationships exactly as specified.
5. Max 50 rows.
6. Return ONLY the SQL. No explanation.

SCHEMA:
${topSchemas}
${fewShotExample}
QUESTION: "${question}"
    `;

  try {
    const response = await axios.post(
      config.ollamaUrl,
      {
        model: "qwen2.5:0.5b", // Using the fast local model configured
        prompt: prompt,
        stream: false,
      },
      { timeout: 30000 },
    ); // 30 second timeout

    const rawText = response.data.response;

    // Clean up markdown and extract ONLY the SQL block
    let sql = rawText
      .replace(/\`\`\`sql/gi, "")
      .replace(/\`\`\`/g, "")
      .replace(/\`/g, '"') // Replace any remaining backticks with double quotes for PG compatibility
      .trim();

    // Small models often add preamble or summary text.
    // We attempt to extract everything from the first SELECT to the first semicolon (or end of string).
    const selectMatch = sql.match(/SELECT[\s\S]*?(?:;|$)/i);
    if (selectMatch) {
      sql = selectMatch[0].trim();
    }

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
