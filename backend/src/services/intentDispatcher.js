const axios = require("axios");
const config = require("../config/env");

/**
 * Uses a combination of entity-based heuristics and LLM analysis to determine intent.
 */
async function dispatchIntent(question) {
  const lowercaseQ = question.toLowerCase();

  // 1. DEFINED ENTITY KEYWORDS
  const TRANSACTIONAL_KEYWORDS = [
    "transaction",
    "revenue",
    "volume",
    "amount",
    "sales",
    "total",
    "top",
    "trend",
    "daily",
    "stat",
    "health",
    "active",
    "inactive",
    "summary",
  ];
  const METADATA_KEYWORDS = ["merchant", "user", "name", "business"];

  const hasTransactional = TRANSACTIONAL_KEYWORDS.some((kw) =>
    lowercaseQ.includes(kw),
  );
  const hasMetadata = METADATA_KEYWORDS.some((kw) => lowercaseQ.includes(kw));

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
5. SQL (Postgres): Role is RELATION MAPPING ONLY. Use for finding merchants/device associations.
6. MONGODB: Role is METRICS & STATS. Use for transactions, system summaries, and device states (active/inactive).
3. HYBRID: Use when mapping a merchant (Postgres) to their transactions/stats (Mongo).

CATEGORIES:
- SQL: "list all merchants", "which merchants have no devices", "find device for merchant Ankush"
- MONGODB: "show transactions", "average device health", "total system revenue", "how many devices are currently inactive"
- HYBRID: "revenue for merchant X", "transactions for merchant Y"

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
