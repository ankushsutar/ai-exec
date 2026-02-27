const axios = require("axios");
const config = require("../config/env");
const { generateEmbedding } = require("./ollamaService");
const { getTopSchemasString } = require("./vectorStore");
const { getBestFewShotExample } = require("./knowledgeBase");

async function generateSQLFromPrompt(
  question,
  originalQuestion = null,
  requestId = "N/A",
) {
  const { getCache, setCache } = require("./cacheService");
  const cachedSql = getCache(question);
  if (cachedSql) {
    console.log(
      `[SQL Agent] [#${requestId}] Cache hit for question:`,
      question,
    );
    return cachedSql;
  }

  console.log(
    `[SQL Agent] [#${requestId}] Prompting LLM for SQL query conversion...`,
  );

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

  const { getPostgresPrompt } = require("../prompts/postgresPrompt");
  const { routeModel } = require("./modelRouter");

  const { model, complexity } = routeModel(question);
  const prompt = getPostgresPrompt(question, topSchemas);

  const { Parser } = require("node-sql-parser");
  const parser = new Parser();

  try {
    const response = await axios.post(
      config.ollamaUrl,
      {
        model: model,
        prompt: prompt,
        stream: false,
      },
      { timeout: 30000 },
    ); // 30 second timeout

    let rawText = response.data.response;

    // Clean up markdown and extract ONLY the SQL block
    let sql = rawText
      .replace(/\`\`\`sql/gi, "")
      .replace(/\`\`\`/g, "")
      .replace(/\`/g, '"')
      .trim();

    // AST VALIDATION LAYER
    try {
      const ast = parser.astify(sql);
      const statement = Array.isArray(ast) ? ast[0] : ast;

      if (statement.type !== "select") {
        throw new Error("PROHIBITED_STMT: Only SELECT queries are allowed.");
      }

      // Re-stringify to ensure clean SQL and auto-quoting if parser supports it
      sql = parser.sqlify(ast);
    } catch (astError) {
      console.warn("[SQL Agent] AST Validation warning:", astError.message);
      // If it's a parse error, we still try the regex fallback but with caution
      if (astError.message.includes("PROHIBITED_STMT")) throw astError;
    }

    // Regex fallback/cleanup for small LLMs if AST failed or missed something
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
    const { setCache } = require("./cacheService");
    setCache(question, sql);
    return sql;
  } catch (error) {
    console.error("[SQL Agent] Error generating SQL:", error.message);
    throw new Error("Failed to generate SQL from prompt.");
  }
}

async function fixSQLFromError(question, failedSql, errorMessage) {
  console.log("[SQL Agent] Attempting to fix failed SQL query...");

  const { getRetryPrompt } = require("../prompts/retryPrompt");
  const prompt = getRetryPrompt(question, failedSql, errorMessage);

  try {
    const response = await axios.post(
      config.ollamaUrl,
      {
        model: "llama3.2:latest", // Always use stronger model for correction
        prompt: prompt,
        stream: false,
      },
      { timeout: 30000 },
    );

    let sql = response.data.response
      .replace(/\`\`\`sql/gi, "")
      .replace(/\`\`\`/g, "")
      .trim();

    const selectMatch = sql.match(/SELECT[\s\S]*?(?:;|$)/i);
    if (selectMatch) {
      sql = selectMatch[0].trim();
    }

    console.log("[SQL Agent] Fixed SQL:", sql);
    return sql;
  } catch (error) {
    console.error("[SQL Agent] Error fixing SQL:", error.message);
    throw new Error("Failed to fix SQL from error.");
  }
}

module.exports = { generateSQLFromPrompt, fixSQLFromError };
