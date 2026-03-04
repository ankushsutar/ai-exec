const axios = require("axios");
const config = require("../config/env");

/**
 * Uses a combination of entity-based heuristics and LLM analysis to determine intent.
 */
async function dispatchIntent(question) {
  const lowercaseQ = question.toLowerCase();

  // 1. DEFINED ENTITY PATTERNS (REGEX for robustness)
  const TRANSACTIONAL_PATTERNS = [
    /trans/i, // trans, transactions, transctions
    /txn/i, // txn, txns
    /rev/i, // revenue, rev
    /vol/i, // volume, vol
    /amt/i, // amount, amt
    /sale/i, // sales
    /total/i,
    /trend/i,
    /daily/i,
    /stat/i,
    /health/i,
    /active/i,
    /inactive/i,
    /summary/i,
    /sum/i,
  ];

  const METADATA_PATTERNS = [/merchant/i, /user/i, /name/i, /business/i];

  const hasTransactional = TRANSACTIONAL_PATTERNS.some((regex) =>
    regex.test(lowercaseQ),
  );
  const hasMetadata = METADATA_PATTERNS.some((regex) => regex.test(lowercaseQ));

  // 2. HEURISTIC OVERRIDE (FAST PATH)
  if (hasTransactional) {
    if (hasMetadata) {
      console.log(
        "[Intent Dispatcher] Heuristic: Identified HYBRID (Metadata + Metrics).",
      );
      return "HYBRID";
    }
    console.log(
      "[Intent Dispatcher] Heuristic: Identified MONGODB (Pure Metrics).",
    );
    return "MONGODB";
  }

  // 3. LLM ANALYSIS (DECISION PATH)
  console.log(
    `[Intent Dispatcher] Analyzing intent via LLM for: "${question}"`,
  );

  const prompt = `
You are AI-Exec, an enterprise-grade data intelligence engine.
Goal: Categorize the user question into "SQL", "MONGODB", or "HYBRID".

ARCHITECTURAL RULES:
1. SQL (Postgres): Role is RELATION MAPPING & METADATA ONLY. Use for finding merchants IDs, user names, or device ownership.
2. MONGODB: Role is EVENTS, METRICS & STATS. Use for transactions, amounts, dates, revenues, and system health.
3. HYBRID: Use when mapping a specific name/entity (Postgres) to their stats (Mongo).

DECISION FLOW:
- If the question asks for "all transactions" or "list of events" -> MONGODB.
- If the question asks for "list of merchants" or "merchant info" -> SQL.
- If the question asks for "transactions for [Name]" -> HYBRID.

CATEGORIES:
- SQL: "list all merchants", "which merchants have no devices", "find device for merchant Ankush"
- MONGODB: "show all transctions", "show transactions on 2026-02-16", "health of system", "total revenue"
- HYBRID: "revenue for merchant X", "transactions for user Y"

QUESTION: "${question}"

OUTPUT: Return ONLY "SQL", "MONGODB", or "HYBRID".
  `;

  try {
    const response = await axios.post(
      config.ollamaUrl,
      {
        model: "llama3.2:latest",
        prompt: prompt,
        stream: false,
      },
      { timeout: 15000 },
    );

    const rawResponse = response.data.response.toUpperCase().trim();
    if (rawResponse.includes("HYBRID")) return "HYBRID";
    if (rawResponse.includes("MONGODB")) return "MONGODB";
    if (rawResponse.includes("SQL")) return "SQL";

    return "SQL"; // Default if response is ambiguous
  } catch (error) {
    console.warn(
      `[Intent Dispatcher] LLM Analysis failed. Falling back to SQL default.`,
      error.message,
    );
    return "SQL";
  }
}

module.exports = { dispatchIntent };
