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
    "best",
    "least",
  ];
  const METADATA_KEYWORDS = ["merchant", "user", "name", "business", "device"];

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
Goal: Categorize the user question into "SQL", "MONGODB", or "HYBRID" to route it to the correct engine.

DATABASES:
- SQL (PostgreSQL): Contains metadata, merchant info, device relations.
- MONGODB: Contains transaction history, revenue, volume.

CATEGORIES:
- SQL: Use for finding metadata, listing merchants/users, checking status.
- MONGODB: Use for direct transaction searches or system-wide metrics.
- HYBRID: Use when filtering by metadata (Postgres) but needing metrics/transactions (Mongo).

FEW-SHOT:
- "top 5 merchants by revenue" -> HYBRID
- "show transactions" -> MONGODB
- "list all merchants" -> SQL

QUESTION: "${question}"

OUTPUT RULES:
- Return ONLY the category name: "SQL", "MONGODB", or "HYBRID".
- Do not explain or add markdown.
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
