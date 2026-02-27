const axios = require("axios");
const config = require("../config/env");

/**
 * Uses the LLM to intelligently determine the query intent: SQL, MongoDB, or Hybrid.
 */
async function dispatchIntent(question) {
  const lowercaseQ = question.toLowerCase();

  // HARDCODE BYPASS: Small LLM often hallucinates SQL for transactions.
  // If the user asks for transactions/revenue/volume, FORCE it to Mongo or Hybrid.
  if (
    lowercaseQ.includes("transaction") ||
    lowercaseQ.includes("revenue") ||
    lowercaseQ.includes("volume")
  ) {
    if (
      lowercaseQ.includes("merchant") ||
      lowercaseQ.includes("user") ||
      lowercaseQ.includes("name")
    ) {
      console.log(
        "[Intent Dispatcher] Heuristic: Forcing HYBRID for transactional request with naming context.",
      );
      return "HYBRID";
    }
    console.log(
      "[Intent Dispatcher] Heuristic: Forcing MONGODB for pure transactional request.",
    );
    return "MONGODB";
  }

  console.log(`[Intent Dispatcher] Analyzing intent for: "${question}"`);

  const prompt = `
    You are a Query Router for a multi-database system.
    Goal: Categorize the user question into "SQL", "MONGODB", or "HYBRID".

    DATABASES:
    - SQL (PostgreSQL): PostgreSQL contains metadata, merchant info, device relations.
    - MONGODB: MongoDB contains "transactionHistoryInfo" (all transactions, revenue, volume).

    CATEGories:
    - SQL: Use for finding metadata, listing merchants/users, checking status.
    - MONGODB: Use for direct transaction searches or system-wide metrics.
    - HYBRID: Use when filtering by NAME (Postgres) but needing metrics/transactions (Mongo).

    FEW-SHOT:
    - "top 5 merchants by revenue" -> HYBRID
    - "show transactions" -> MONGODB
    - "list all merchants" -> SQL

    QUESTION: "${question}"
    CATEGORY (ONLY ONE WORD):
  `;

  try {
    const response = await axios.post(
      config.ollamaUrl,
      {
        model: "llama3.2:latest",
        prompt: prompt,
        stream: false,
      },
      { timeout: 10000 },
    );

    const rawResponse = response.data.response.toUpperCase().trim();
    let intent = "SQL";

    if (rawResponse.includes("HYBRID")) intent = "HYBRID";
    else if (rawResponse.includes("MONGODB")) intent = "MONGODB";
    else if (rawResponse.includes("SQL")) intent = "SQL";

    console.log(`[Intent Dispatcher] Llama Parsed Intent: ${intent}`);
    return intent;

    return "SQL"; // Default fallback
  } catch (error) {
    console.warn(
      `[Intent Dispatcher] Analysis failed, falling back to heuristic.`,
      error.message,
    );
    return null; // Signals to use heuristic fallback
  }
}

module.exports = { dispatchIntent };
