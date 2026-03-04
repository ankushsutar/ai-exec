const axios = require("axios");
const config = require("../config/env");

/**
 * Uses a combination of entity-based heuristics and LLM analysis to determine intent.
 */
async function dispatchIntent(question) {
  const lowercaseQ = question.toLowerCase();

  // 1. DEFINED ENTITY PATTERNS (REGEX for robustness)
  const MONGODB_TXN_PATTERNS = [
    /\btransaction\b/i,
    /\brevenue\b/i,
    /\bpayment\b/i,
    /\btxn\b/i,
    /\bamount\b/i,
  ];

  const MONGODB_STATS_PATTERNS = [
    /\bdevice stats\b/i,
    /\bsignal\b/i,
    /\bnetwork\b/i,
    /\bbattery\b/i,
    /\bdevice uptime\b/i,
  ];

  const HYBRID_PATTERNS = [
    /\bmerchant\b/i,
    /\bmerchant revenue\b/i,
    /\bmerchant devices\b/i,
  ];

  const hasHybrid = HYBRID_PATTERNS.some((regex) => regex.test(lowercaseQ));
  const hasTxn = MONGODB_TXN_PATTERNS.some((regex) => regex.test(lowercaseQ));
  const hasStats = MONGODB_STATS_PATTERNS.some((regex) =>
    regex.test(lowercaseQ),
  );

  // 2. HEURISTIC OVERRIDE (FAST PATH)
  if (hasHybrid) {
    console.log(
      "[Intent Dispatcher] Heuristic: Identified HYBRID (Metadata + Metrics).",
    );
    return "HYBRID";
  }

  if (hasTxn) {
    console.log(
      "[Intent Dispatcher] Heuristic: Identified MONGODB_TXN (Transaction Metrics).",
    );
    return "MONGODB_TXN";
  }

  if (hasStats) {
    console.log(
      "[Intent Dispatcher] Heuristic: Identified MONGODB_STATS (Device Stats).",
    );
    return "MONGODB_STATS";
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
    if (rawResponse.includes("MONGODB_TXN") || rawResponse.includes("MONGODB"))
      return "MONGODB_TXN";
    if (rawResponse.includes("MONGODB_STATS")) return "MONGODB_STATS";
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
