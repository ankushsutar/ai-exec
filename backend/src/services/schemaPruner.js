const axios = require("axios");
const config = require("../config/env");
const db = require("../config/db");

async function extractAllTableNames() {
  try {
    console.log(
      `[Schema Pruner] Extracting all raw table names from database...`,
    );
    const query = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
        `;
    const result = await db.query(query);
    const tableNames = result.rows.map((row) => row.table_name);
    return tableNames;
  } catch (error) {
    console.error(
      `[Schema Pruner] Error extracting table names:`,
      error.message,
    );
    throw error;
  }
}

async function getAICuratedTables(tableNames) {
  if (!tableNames || tableNames.length === 0) return [];

  // RELIABILITY CHECK: If there are only a few tables anyway, don't prune.
  // This prevents the AI from accidentally missing core tables in smaller databases.
  if (tableNames.length <= 50) {
    console.log(
      `[Schema Pruner] Skipping pruning for small database (${tableNames.length} tables). Using full whitelist.`,
    );
    return tableNames;
  }

  console.log(
    `[Schema Pruner] Asking AI to prune ${tableNames.length} tables...`,
  );

  const prompt = `
You are an expert Database Administrator. I am building a Text-to-SQL AI for business executives.
Below is a raw list of all tables in my PostgreSQL database. 
Many might be system logs, migrations, or internal auth tables.

Your task is to identify ONLY the tables that hold core business value (e.g., users, transactions, products, devices, merchants, health logs, sales).
EXCLUDE items like: migrations, audit_logs, password_resets, job_queues, cached_sessions.

Return ONLY a comma-separated list of the relevant table names.
Do NOT include any explanations, formatting, markdown formatting, or spaces.
Just the raw comma-separated list.

RAW TABLES:
${tableNames.join(", ")}
    `;

  try {
    const response = await axios.post(config.ollamaUrl, {
      model: "qwen2.5:0.5b", // Very fast local model for this quick binary task
      prompt: prompt,
      stream: false,
    });

    // Clean and parse the CSV string
    const rawText = response.data.response;
    console.log(`[Schema Pruner] Raw AI response: "${rawText.trim()}"`);

    // Strip markdown backticks, 'plaintext', trim, and split by comma or newline
    const cleanedText = rawText
      .replace(/\`\`\`[a-z]*/gi, "")
      .replace(/\`\`\`/g, "")
      .replace(/\`/g, "");
    // Split by comma or newline to handle lists better
    let curatedList = cleanedText
      .split(/[\n,]/)
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    // Ensure we only return tables that actually existed in the original list to prevent hallucinations
    curatedList = curatedList.filter((name) => tableNames.includes(name));

    console.log(
      `[Schema Pruner] AI curated ${curatedList.length} relevant tables: ${curatedList.join(", ")}`,
    );
    return curatedList;
  } catch (error) {
    console.error("[Schema Pruner] Error during AI curation:", error.message);
    console.warn("[Schema Pruner] Fallback: Using all available tables.");
    return tableNames; // Fallback to all tables if LLM fails
  }
}

module.exports = { extractAllTableNames, getAICuratedTables };
