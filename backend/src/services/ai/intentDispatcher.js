const axios = require("axios");
const config = require("../../config/env");

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
    /\bbattery\b/i,
    /\bdevice uptime\b/i,
    /\bsignal\b/i,
  ];

  const SQL_PATTERNS = [
    /\buser/i,
    /\brole/i,
    /\bgroup/i,
    /\baccess right/i,
    /\bpermission/i,
    /\bhierarchy/i,
  ];

  const MONGODB_BI_PATTERNS = [
    // ── Revenue ──────────────────────────────────────────────────────────────
    { intent: "MONGODB_BI_TOTAL_REV", regex: /\btotal\s+revenue\b/i },
    {
      intent: "MONGODB_BI_TOTAL_REV",
      regex: /\bhow\s+much\s+(total\s+)?revenue\b/i,
    },
    { intent: "MONGODB_BI_TOTAL_REV", regex: /\boverall\s+revenue\b/i },

    // Revenue trend / daily breakdown -- checked FIRST (specific), before the broad N-days pattern
    { intent: "MONGODB_BI_REV_TREND", regex: /\bdaily\s+revenue\s+trend\b/i },
    { intent: "MONGODB_BI_REV_TREND", regex: /\brevenue\s+trend\b/i },
    { intent: "MONGODB_BI_REV_TREND", regex: /\brev.*trend\b/i },
    {
      intent: "MONGODB_BI_REV_TREND",
      regex: /\brevenue\s+over\s+(?:time|days?|weeks?|months?)\b/i,
    },

    // Revenue total for last N days -- broad, checked AFTER trend patterns.
    // Negative lookahead prevents matching "revenue trend last X days".
    {
      intent: "MONGODB_BI_REV_7D",
      regex: /\brevenue(?!.*\btrend\b).*(?:last|past)\s+\d+\s+days?\b/i,
    },
    {
      intent: "MONGODB_BI_REV_7D",
      regex: /\brevenue(?!.*\btrend\b).*(?:last|past)\s+week\b/i,
    },
    { intent: "MONGODB_BI_REV_7D", regex: /\brevenue.*last\s+7\s+days?\b/i },

    // Revenue per device / by device
    {
      intent: "MONGODB_BI_REV_PER_DEVICE",
      regex: /\brevenue\s+per\s+device\b/i,
    },
    {
      intent: "MONGODB_BI_REV_PER_DEVICE",
      regex: /\brevenue\s+by\s+device\b/i,
    },
    {
      intent: "MONGODB_BI_REV_PER_DEVICE",
      regex: /\bdevice[-\s]+wise\s+revenue\b/i,
    },

    // Revenue per day of week
    {
      intent: "MONGODB_BI_DAY_OF_WEEK",
      regex: /\bday\s+of\s+(?:the\s+)?week\b/i,
    },
    { intent: "MONGODB_BI_DAY_OF_WEEK", regex: /\bweekday\s+revenue\b/i },
    {
      intent: "MONGODB_BI_DAY_OF_WEEK",
      regex: /\brevenue\s+by\s+(?:day|weekday)\b/i,
    },

    // Highest revenue device by month -- MUST come before MONGODB_BI_TOP_DEVICES_REV
    {
      intent: "MONGODB_BI_HIGH_REV_DEV_MONTH",
      regex:
        /\bbest\s+device\s+(?:in|for)\s+(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i,
    },
    {
      intent: "MONGODB_BI_HIGH_REV_DEV_MONTH",
      regex:
        /\bhighest\s+revenue\s+device.*(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|month)\b/i,
    },
    {
      intent: "MONGODB_BI_HIGH_REV_DEV_MONTH",
      regex:
        /\btop\s+(?:\d+\s+)?(?:revenue\s+)?device.*(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i,
    },
    {
      intent: "MONGODB_BI_HIGH_REV_DEV_MONTH",
      regex: /\bbest\s+(?:performing\s+)?device.*month\b/i,
    },
    {
      intent: "MONGODB_BI_HIGH_REV_DEV_MONTH",
      regex:
        /\bbest\s+(?:performing\s+)?device\s+(?:in|for)\s+(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i,
    },

    // ── Transactions ─────────────────────────────────────────────────────────
    { intent: "MONGODB_BI_SUCCESS_RATE", regex: /\bsuccess\s+rate\b/i },
    { intent: "MONGODB_BI_SUCCESS_RATE", regex: /\btransaction\s+success\b/i },
    {
      intent: "MONGODB_BI_SUCCESS_RATE",
      regex: /\bhow\s+many\s+(?:transactions?)?\s+success/i,
    },

    { intent: "MONGODB_BI_FAILURE_ANALYSIS", regex: /\bfailure\s+analysis\b/i },
    {
      intent: "MONGODB_BI_FAILURE_ANALYSIS",
      regex: /\btransaction\s+fail(?:ure|ed)?\s+analysis\b/i,
    },

    {
      intent: "MONGODB_BI_AVG_TXN_VAL",
      regex: /\baverage\s+transaction\s+(?:value|amount)\b/i,
    },
    {
      intent: "MONGODB_BI_AVG_TXN_VAL",
      regex: /\bavg\s+(?:transaction\s+)?(?:value|amount)\b/i,
    },
    {
      intent: "MONGODB_BI_AVG_TXN_VAL",
      regex: /\bmean\s+(?:transaction\s+)?(?:value|amount)\b/i,
    },

    {
      intent: "MONGODB_BI_HOURLY_DIST",
      regex: /\bhourly\s+(?:transaction\s+)?distribution\b/i,
    },
    {
      intent: "MONGODB_BI_HOURLY_DIST",
      regex: /\btransactions\s+by\s+hour\b/i,
    },
    { intent: "MONGODB_BI_HOURLY_DIST", regex: /\bhour(?:ly)?\s+breakdown\b/i },

    {
      intent: "MONGODB_BI_MODE_DIST",
      regex: /\btransaction\s+mode\s+distribution\b/i,
    },
    {
      intent: "MONGODB_BI_MODE_DIST",
      regex: /\bpayment\s+mode\s+(?:distribution|breakdown)\b/i,
    },
    { intent: "MONGODB_BI_MODE_DIST", regex: /\bby\s+(?:payment\s+)?mode\b/i },

    {
      intent: "MONGODB_BI_TYPE_DIST",
      regex: /\btransaction\s+type\s+distribution\b/i,
    },
    {
      intent: "MONGODB_BI_TYPE_DIST",
      regex: /\bpayment\s+type\s+(?:distribution|breakdown)\b/i,
    },
    {
      intent: "MONGODB_BI_TYPE_DIST",
      regex: /\bby\s+(?:transaction\s+)?type\b/i,
    },

    {
      intent: "MONGODB_BI_LARGEST_TXNS",
      regex: /\blargest\s+(?:\d+\s+)?transactions?\b/i,
    },
    {
      intent: "MONGODB_BI_LARGEST_TXNS",
      regex: /\bbiggest\s+(?:\d+\s+)?transactions?\b/i,
    },
    {
      intent: "MONGODB_BI_LARGEST_TXNS",
      regex: /\bhighest\s+(?:amount|value)\s+transactions?\b/i,
    },
    {
      intent: "MONGODB_BI_LARGEST_TXNS",
      regex: /\btop\s+\d*\s*transactions?\s+by\s+(?:amount|value)\b/i,
    },

    {
      intent: "MONGODB_BI_DAILY_VOL",
      regex: /\bdaily\s+transaction\s+volume\b/i,
    },
    {
      intent: "MONGODB_BI_DAILY_VOL",
      regex: /\btransaction\s+(?:volume|count)\s+per\s+day\b/i,
    },
    {
      intent: "MONGODB_BI_DAILY_VOL",
      regex: /\bdaily\s+(?:transaction\s+)?count\b/i,
    },
    { intent: "MONGODB_BI_DAILY_VOL", regex: /\btransactions?\s+per\s+day\b/i },

    // High-value transactions
    {
      intent: "MONGODB_BI_HIGH_VALUE",
      regex: /\bhigh[-\s]+value\s+transactions?\b/i,
    },
    {
      intent: "MONGODB_BI_HIGH_VALUE",
      regex:
        /\btransactions?\s+(?:above|over|exceeding|greater\s+than|more\s+than)\s+[\d,₹$]+/i,
    },
    { intent: "MONGODB_BI_HIGH_VALUE", regex: /\bvalue\s+over\b/i },
    { intent: "MONGODB_BI_HIGH_VALUE", regex: /\blarge\s+transactions?\b/i },

    // ── Devices ──────────────────────────────────────────────────────────────
    {
      intent: "MONGODB_BI_ACTIVE_24H",
      regex:
        /\bactive\s+devices?\s*(?:in|last|past)?\s*(?:last\s+)?24\s*(?:h|hours?)?\b/i,
    },
    {
      intent: "MONGODB_BI_ACTIVE_24H",
      regex: /\bdevices?\s+active\s+(?:today|now|currently)\b/i,
    },
    {
      intent: "MONGODB_BI_ACTIVE_24H",
      regex: /\bactive\s+devices?\s+today\b/i,
    },

    // ── DEVICE TELEMETRY / STATS ─────────────────────────────────────────────

    // 22 Network Quality by Operator
    {
      intent: "MONGODB_BI_NETWORK_QUALITY",
      regex: /\b(?:average|avg)\s+signal\s+strength\b/i,
    },
    { intent: "MONGODB_BI_NETWORK_QUALITY", regex: /\bnetwork\s+quality\b/i },
    {
      intent: "MONGODB_BI_NETWORK_QUALITY",
      regex: /\bsignal\s+by\s+operator\b/i,
    },

    // 23 High Network Failure Devices
    {
      intent: "MONGODB_BI_NETWORK_FAILURES",
      regex: /\bnetwork\s+failures?\b/i,
    },
    {
      intent: "MONGODB_BI_NETWORK_FAILURES",
      regex:
        /\bdevices?\s+with\s+(?:most|highest|bad)\s+network\s+failures?\b/i,
    },
    { intent: "MONGODB_BI_NETWORK_FAILURES", regex: /\bnetwork\s+errors?\b/i },
    { intent: "MONGODB_BI_NETWORK_FAILURES", regex: /\bpoor\s+network\b/i },

    // 24 Average Device Uptime
    {
      intent: "MONGODB_BI_AVG_UPTIME",
      regex: /\b(?:average|avg)\s+(?:device\s+)?uptime\b/i,
    },
    {
      intent: "MONGODB_BI_AVG_UPTIME",
      regex: /\bhow\s+long\s+are\s+devices\s+(?:up|online)\b/i,
    },
    { intent: "MONGODB_BI_AVG_UPTIME", regex: /\bdevice\s+run\s*time\b/i },

    // 25 Firmware Distribution
    {
      intent: "MONGODB_BI_FIRMWARE_DIST",
      regex: /\bfirmware\s+(?:distribution|versions?)\b/i,
    },
    {
      intent: "MONGODB_BI_FIRMWARE_DIST",
      regex: /\bhow\s+many\s+devices\s+are\s+on\s+firmware\b/i,
    },
    {
      intent: "MONGODB_BI_FIRMWARE_DIST",
      regex: /\bdevice\s+models?\s+and\s+versions?\b/i,
    },

    // 26 Audio Failure Devices
    { intent: "MONGODB_BI_AUDIO_FAILURES", regex: /\baudio\s+failures?\b/i },
    {
      intent: "MONGODB_BI_AUDIO_FAILURES",
      regex: /\bfailed\s+to\s+play\s+(?:audio|sound)?\b/i,
    },
    {
      intent: "MONGODB_BI_AUDIO_FAILURES",
      regex: /\btransactions\s+failed\s+to\s+play\b/i,
    },

    // 27 Device Button Usage
    {
      intent: "MONGODB_BI_BUTTON_USAGE",
      regex: /\b(?:device\s+)?button\s+(?:usage|presses)\b/i,
    },
    {
      intent: "MONGODB_BI_BUTTON_USAGE",
      regex: /\bvolume\s+(?:up|down)\s+presses\b/i,
    },
    {
      intent: "MONGODB_BI_BUTTON_USAGE",
      regex: /\breplay\s+(?:button|presses)\b/i,
    },

    // 28 Data Consumption by Operator
    {
      intent: "MONGODB_BI_DATA_CONSUMPTION",
      regex: /\bdata\s+(?:consumption|usage)\b/i,
    },
    {
      intent: "MONGODB_BI_DATA_CONSUMPTION",
      regex: /\btraffic\s+(?:consumed|usage)\b/i,
    },
    { intent: "MONGODB_BI_DATA_CONSUMPTION", regex: /\btx\s+and\s+rx\b/i },

    // 29 Reboot Analysis
    {
      intent: "MONGODB_BI_REBOOT_ANALYSIS",
      regex: /\breboot\s+(?:analysis|reasons?)\b/i,
    },
    {
      intent: "MONGODB_BI_REBOOT_ANALYSIS",
      regex: /\bdevices?\s+(?:that\s+)?rebooted\b/i,
    },
    { intent: "MONGODB_BI_REBOOT_ANALYSIS", regex: /\bhighest\s+reboot\b/i },

    // 30 Low Battery Devices
    {
      intent: "MONGODB_BI_LOW_BATTERY",
      regex: /\b(?:low|critical)\s+battery\b/i,
    },
    {
      intent: "MONGODB_BI_LOW_BATTERY",
      regex: /\bbattery\s+(?:health|issues|level)\b/i,
    },

    // 31 Storage Failures
    {
      intent: "MONGODB_BI_STORAGE_FAILS",
      regex: /\b(?:flash|storage|file)\s+failures?\b/i,
    },
    { intent: "MONGODB_BI_STORAGE_FAILS", regex: /\bdownload\s+failures?\b/i },

    // 32 Server Communication Errors
    {
      intent: "MONGODB_BI_SERVER_ERRORS",
      regex: /\b(?:server|http|mqtt)\s+(?:errors?|failures?|communication)\b/i,
    },
    { intent: "MONGODB_BI_SERVER_ERRORS", regex: /\bconnection\s+issues?\b/i },

    // 33 USB Port Reliability
    {
      intent: "MONGODB_BI_USB_RELIABILITY",
      regex: /\busb\s+(?:reliability|plugins?|ports?)\b/i,
    },
    {
      intent: "MONGODB_BI_USB_RELIABILITY",
      regex: /\bflaky\s+(?:usb|connection)\b/i,
    },

    // 34 SIM and Network Drops
    {
      intent: "MONGODB_BI_SIM_DROPS",
      regex: /\bsim\s+(?:swaps?|drops?|changes?)\b/i,
    },
    { intent: "MONGODB_BI_SIM_DROPS", regex: /\bnetwork\s+drops?\b/i },

    // Top N devices by revenue — catches "top 5 devices", "top devices by revenue", "best performing devices"
    {
      intent: "MONGODB_BI_TOP_DEVICES_REV",
      regex: /\btop\s+\d*\s*devices?\s+(?:by\s+)?revenue\b/i,
    },
    {
      intent: "MONGODB_BI_TOP_DEVICES_REV",
      regex: /\bbest\s+(?:performing\s+)?devices?\b/i,
    },
    {
      intent: "MONGODB_BI_TOP_DEVICES_REV",
      regex: /\bhighest\s+(?:earning|revenue)\s+devices?\b/i,
    },
    {
      intent: "MONGODB_BI_TOP_DEVICES_REV",
      regex: /\btop\s+\d+\s+devices?\b/i,
    },

    {
      intent: "MONGODB_BI_TXN_FREQ",
      regex: /\bdevice\s+transaction\s+frequency\b/i,
    },
    {
      intent: "MONGODB_BI_TXN_FREQ",
      regex: /\btransactions?\s+per\s+device\b/i,
    },
    {
      intent: "MONGODB_BI_TXN_FREQ",
      regex: /\bdevice\s+(?:usage|activity)\s+frequency\b/i,
    },

    // Devices with most failures
    {
      intent: "MONGODB_BI_FAILURES",
      regex: /\bhighest\s+(?:failure|failing)\b/i,
    },
    { intent: "MONGODB_BI_FAILURES", regex: /\btransaction\s+failures?\b/i },
    {
      intent: "MONGODB_BI_FAILURES",
      regex: /\bdevices?\s+(?:with\s+)?(?:most|highest)\s+fail(?:ure|ed)?\b/i,
    },
    { intent: "MONGODB_BI_FAILURES", regex: /\bfailing\s+devices?\b/i },
    {
      intent: "MONGODB_BI_FAILURES",
      regex: /\bdevice\s+(?:failure|error)\s+(?:rate|count)\b/i,
    },

    // ── DEVICE TELEMETRY / STATS ─────────────────────────────────────────────

    // ARPAD
    { intent: "MONGODB_BI_ARPAD", regex: /\barpad\b/i },
    {
      intent: "MONGODB_BI_ARPAD",
      regex: /\baverage\s+revenue\s+per\s+(?:active\s+)?device\b/i,
    },
    {
      intent: "MONGODB_BI_ARPAD",
      regex: /\brevenue\s+per\s+active\s+device\b/i,
    },

    // ── System ───────────────────────────────────────────────────────────────
    { intent: "MONGODB_BI_SYSTEM_SUMMARY", regex: /\bsystem\s+summary\b/i },
    {
      intent: "MONGODB_BI_SYSTEM_SUMMARY",
      regex: /\boverall\s+(?:system\s+)?stats?(?:istics)?\b/i,
    },
    {
      intent: "MONGODB_BI_SYSTEM_SUMMARY",
      regex: /\bgive\s+(?:me\s+)?(?:a\s+)?summary\b/i,
    },
    { intent: "MONGODB_BI_SYSTEM_SUMMARY", regex: /\bdashboard\s+overview\b/i },
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
  const hasSql = SQL_PATTERNS.some((regex) => regex.test(lowercaseQ));

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

  if (hasSql) {
    console.log(
      "[Intent Dispatcher] Heuristic: Identified SQL (Metadata/User Management).",
    );
    return "SQL";
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
- MONGODB: "show all transactions", "show transactions on 2026-02-16", "overall system summary", "total revenue"
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
