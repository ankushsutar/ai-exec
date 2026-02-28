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

  // Routing with options:
  // - If we have a very weak few-shot or no schemas, we might want a stronger model.
  const { model, complexity } = routeModel(question, {
    forceLlama:
      !fewShotExample ||
      fewShotExample.score < 0.6 ||
      !topSchemas ||
      question.toLowerCase().includes("transaction"),
    engine: "sql",
  });
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
      { timeout: 60000 },
    ); // Increased to 60s for Llama 3.2

    let rawText = response.data.response;

    // EMERGENCY EXTRACTION: Check if LLM returned a JSON object instead of raw SQL
    try {
      const cleanJson = rawText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed.query) rawText = parsed.query;
      else if (parsed.sql) rawText = parsed.sql;
      else if (parsed.SELECT) rawText = parsed.SELECT;
      else if (typeof parsed === "object") {
        const keys = Object.keys(parsed);
        if (keys.length === 1) rawText = parsed[keys[0]];
      }
    } catch (e) {
      // Not JSON, continue with normal extraction
    }

    // Clean up markdown and extract ONLY the SQL block
    let sql = rawText
      .replace(/```sql/gi, "")
      .replace(/```/g, "")
      .trim();

    // AST VALIDATION LAYER
    try {
      // Extract ONLY the SELECT statement part in case of conversational noise
      const selectOnlyMatch = sql.match(/SELECT[\s\S]*?(?:;|$)/i);
      if (selectOnlyMatch) {
        sql = selectOnlyMatch[0].trim();
      }

      // Configure parser for PostgreSQL
      const ast = parser.astify(sql, { database: "postgresql" });
      const statement = Array.isArray(ast) ? ast[0] : ast;

      if (statement.type !== "select") {
        throw new Error("PROHIBITED_STMT: Only SELECT queries are allowed.");
      }

      // Re-stringify with PostgreSQL flavor (double quotes)
      sql = parser.sqlify(ast, { database: "postgresql" });
    } catch (astError) {
      console.warn("[SQL Agent] AST Validation warning:", astError.message);
      // If it's a parse error, we still try to clean up the raw string
      if (astError.message.includes("PROHIBITED_STMT")) throw astError;

      // Post-process: Force double quotes on anything that looks like a backticked or bracketed identifier
      sql = sql.replace(/[`\[\]]/g, '"');
    }

    // Dialect cleanup: Fix multipart identifiers that the LLM quoted together (e.g. "table.column" -> "table"."column")
    sql = sql.replace(/"([^".\s]+)\.([^"\s]+)"/g, '"$1"."$2"');

    // Dialect cleanup: Fix backticked or bracketed aliases that might remain
    sql = sql.replace(/`([^`]+)`/g, '"$1"');
    sql = sql.replace(/\[([^\]]+)\]/g, '"$1"');

    // ALIAS VALIDATION & HALLUCINATION FIX
    // Extract all defined aliases in the query
    const aliasMatches = [...sql.matchAll(/AS\s+"([^"]+)"/gi)].map((m) => m[1]);
    const tableNames = [...sql.matchAll(/FROM\s+"([^"]+)"/gi)].map((m) => m[1]);
    const joinTableNames = [...sql.matchAll(/JOIN\s+"([^"]+)"/gi)].map(
      (m) => m[1],
    );
    const allValidPrefixes = [
      ...new Set([...aliasMatches, ...tableNames, ...joinTableNames]),
    ];

    // Detect undefined prefixes (e.g. "r"."column" where "r" is not an alias)
    const prefixMatches = [...sql.matchAll(/"([^"]+)"\."([^"]+)"/g)];
    prefixMatches.forEach((match) => {
      const prefix = match[1];
      if (!allValidPrefixes.includes(prefix)) {
        console.warn(`[SQL Agent] Detected undefined alias prefix: ${prefix}`);
        // Heuristic fix for common hallucinations
        if (prefix === "r" || prefix === "relation") {
          sql = sql.split(`"${prefix}"."`).join('"merchantRelationInfo"."');
        } else if (prefix === "d" || prefix === "device") {
          sql = sql.split(`"${prefix}"."`).join('"deviceRelationInfo"."');
        } else if (prefix === "m" || prefix === "merchant") {
          sql = sql.split(`"${prefix}"."`).join('"merchantInfo"."');
        }
      }
    });

    // Dialect cleanup: Small LLMs often mix SQLite/MySQL syntax in Postgres
    sql = sql.replace(
      /STRFTIME\([^,]+,\s*([^)]+)\)/gi,
      "TO_CHAR($1, 'YYYY-MM-DD')",
    );

    // Regex fallback/cleanup for small LLMs if AST failed or missed something
    const selectMatch = sql.match(/SELECT[\s\S]*?(?:;|$)/i);
    if (selectMatch) {
      sql = selectMatch[0].trim();
    }

    // The small LLM often forgets to quote identifiers. Let's force-quote known tables if parser missed them.
    const tableMatches = [...topSchemas.matchAll(/TABLE: "([^"]+)"/g)].map(
      (m) => m[1],
    );
    for (const tbl of tableMatches) {
      const regex = new RegExp(`(?<!["\\.])\\b${tbl}\\b(?!")`, "gi");
      sql = sql.replace(regex, `"${tbl}"`);
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

    // LEARN FROM SUCCESS: Record this fix in the knowledge base
    const { recordLearnedFix } = require("./knowledgeBase");
    recordLearnedFix(question, sql);

    return sql;
  } catch (error) {
    console.error("[SQL Agent] Error fixing SQL:", error.message);
    throw new Error("Failed to fix SQL from error.");
  }
}

module.exports = { generateSQLFromPrompt, fixSQLFromError };
