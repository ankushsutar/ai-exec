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

  const MONGODB_BI_PATTERNS = [
    // 1-16 Base Library
    { intent: "MONGODB_BI_TOTAL_REV", regex: /\btotal revenue\b/i },
    { intent: "MONGODB_BI_REV_7D", regex: /\brevenue.*last 7 days\b/i },
    { intent: "MONGODB_BI_REV_TREND", regex: /\bdaily revenue trend\b/i },
    { intent: "MONGODB_BI_REV_TREND", regex: /\brev.*trend\b/i },
    { intent: "MONGODB_BI_REV_PER_DEVICE", regex: /\brevenue per device\b/i },
    { intent: "MONGODB_BI_SUCCESS_RATE", regex: /\bsuccess rate\b/i },
    { intent: "MONGODB_BI_FAILURE_ANALYSIS", regex: /\bfailure analysis\b/i },
    {
      intent: "MONGODB_BI_AVG_TXN_VAL",
      regex: /\baverage transaction value\b/i,
    },
    { intent: "MONGODB_BI_AVG_TXN_VAL", regex: /\bavg transaction value\b/i },
    {
      intent: "MONGODB_BI_HOURLY_DIST",
      regex: /\bhourly transaction distribution\b/i,
    },
    { intent: "MONGODB_BI_HOURLY_DIST", regex: /\bhourly distribution\b/i },
    { intent: "MONGODB_BI_ACTIVE_24H", regex: /\bactive devices.*24\b/i },
    {
      intent: "MONGODB_BI_TOP_DEVICES_REV",
      regex: /\btop (10\s)?devices.*revenue\b/i,
    },
    {
      intent: "MONGODB_BI_TXN_FREQ",
      regex: /\bdevice transaction frequency\b/i,
    },
    {
      intent: "MONGODB_BI_MODE_DIST",
      regex: /\btransaction mode distribution\b/i,
    },
    {
      intent: "MONGODB_BI_TYPE_DIST",
      regex: /\btransaction type distribution\b/i,
    },
    { intent: "MONGODB_BI_LARGEST_TXNS", regex: /\blargest transactions\b/i },
    { intent: "MONGODB_BI_DAILY_VOL", regex: /\bdaily transaction volume\b/i },
    {
      intent: "MONGODB_BI_HIGH_REV_DEV_MONTH",
      regex: /\bhighest revenue device.*month\b/i,
    },

    // 17-20 New BI Ops
    { intent: "MONGODB_BI_ARPAD", regex: /\barpad\b/i },
    {
      intent: "MONGODB_BI_ARPAD",
      regex: /\baverage revenue per active device\b/i,
    },
    { intent: "MONGODB_BI_FAILURES", regex: /\bhighest failure\b/i },
    { intent: "MONGODB_BI_FAILURES", regex: /\btransaction failure\b/i },
    { intent: "MONGODB_BI_HIGH_VALUE", regex: /\bhigh value transaction\b/i },
    { intent: "MONGODB_BI_HIGH_VALUE", regex: /\bvalue over\b/i },
    { intent: "MONGODB_BI_DAY_OF_WEEK", regex: /\bday of week\b/i },
    { intent: "MONGODB_BI_DAY_OF_WEEK", regex: /\bday of the week\b/i },
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

  let biIntent = null;
  for (const pattern of MONGODB_BI_PATTERNS) {
    if (pattern.regex.test(lowercaseQ)) {
      biIntent = pattern.intent;
      break;
    }
  }

  // 2. HEURISTIC OVERRIDE (FAST PATH)
  if (biIntent) {
    console.log(
      `[Intent Dispatcher] Heuristic: Identified BI Query (${biIntent}).`,
    );
    return biIntent;
  }

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
