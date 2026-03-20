/**
 * Capability Registry
 * 
 * Centralized definition of all analytical capabilities.
 * Replaces loose intents with strict, typed IDs and parameters.
 */

const CAPABILITIES = [
  // --- REVENUE & SALES ---
  {
    id: "LIST_TOP_TRANSACTIONS",
    libraryFunction: "getLargestTransactions", // Already exists but will be generalized
    description: "List individual high-value transactions with details (not aggregate).",
    params: ["limit", "timeRange"],
    keywords: ["transactions", "records", "show individual", "top 5 transactions", "largest sales"]
  },
  {
    id: "TOTAL_REVENUE",
    libraryFunction: "getTotalRevenue",
    description: "Total amount (sum of txnAmt) for specific months, years, or all time, or trailing days (e.g. last 6 months).",
    params: ["timeRange"],
    keywords: ["revenue", "sales", "total amount", "earned", "how much money"]
  },
  {
    id: "REVENUE_TREND",
    libraryFunction: "getRevenueTrendPerDay",
    description: "Daily revenue trends or graphs for a specific time range.",
    params: ["timeRange"],
    keywords: ["trend", "daily", "graph", "chart", "progression"]
  },
  {
    id: "AVERAGE_TRANSACTION_VALUE",
    libraryFunction: "getGeneralizedAggregate",
    description: "Average amount (mean txnAmt) per transaction, with optional grouping or filtering.",
    params: ["metric", "dimension", "threshold", "operator", "limit", "timeRange"],
    keywords: ["average value", "ticket size", "mean amount"]
  },

  // --- VOLUME & COUNTS ---
  {
    id: "TRANSACTION_VOLUME",
    libraryFunction: "getGeneralizedAggregate",
    description: "Count of transactions (number of sales), with optional grouping by device, mode, etc.",
    params: ["metric", "dimension", "threshold", "operator", "limit", "timeRange"],
    keywords: ["volume", "count", "number of transactions", "how many sales", "transactions per device"]
  },
  {
    id: "HOURLY_DISTRIBUTION",
    libraryFunction: "getGeneralizedAggregate",
    description: "Transaction density per hour (heat map), with optional filtering.",
    params: ["metric", "dimension", "threshold", "operator", "limit", "timeRange"],
    keywords: ["hourly", "time of day", "peak hours", "distribution"]
  },

  // --- DEVICE PERFORMANCE ---
  {
    id: "TOP_DEVICES_REVENUE",
    libraryFunction: "getGeneralizedAggregate",
    description: "List of devices ranked by revenue, with optional threshold filtering (e.g. revenue > 10000).",
    params: ["metric", "dimension", "threshold", "operator", "limit", "timeRange"],
    keywords: ["top devices", "best performing", "revenue less than", "revenue more than", "revenue above"]
  },
  {
    id: "DEVICE_FAILURE_ALERTS",
    libraryFunction: "getDevicesWithHighestFailures",
    description: "Operational list of devices failing transactions frequently.",
    params: ["limit", "timeRange"],
    keywords: ["failing devices", "most failures", "broken", "errors"]
  },
  {
    id: "AVERAGE_REVENUE_PER_DEVICE",
    libraryFunction: "getAverageRevenuePerDevice",
    description: "Average Revenue Per Active Device (ARPAD) for a time range.",
    params: ["timeRange"],
    keywords: ["average revenue per device", "arpad", "revenue per active device"]
  },
  {
    id: "DEVICE_FAILURE_ANALYSIS",
    libraryFunction: "getDevicesWithHighestFailures",
    description: "List of devices with the most failed transactions.",
    params: ["limit", "timeRange"],
    keywords: ["failing devices", "most failures", "error counts"]
  },
  {
    id: "HIGH_VALUE_XNS",
    libraryFunction: "getHighValueTransactions",
    description: "List of individual transactions exceeding a specific threshold.",
    params: ["threshold", "limit", "timeRange"],
    keywords: ["high value", "expensive transactions", "large sales", "above 10000"]
  },
  {
    id: "DAY_OF_WEEK_REVENUE",
    libraryFunction: "getRevenueByDayOfWeek",
    description: "Revenue distribution across days of the week.",
    params: ["timeRange"],
    keywords: ["day of week", "weekday", "weekend revenue"]
  },
  {
    id: "AUDIO_LATENCY",
    libraryFunction: "getAverageAudioLatency",
    description: "Average delay for audio playback after success.",
    params: ["timeRange"],
    keywords: ["audio latency", "delay", "lag"]
  },
  {
    id: "SUCCESS_RATE_BY_MODE",
    libraryFunction: "getSuccessRateByMode",
    description: "Transaction success rates broken down by mode (e.g. UPI, Card).",
    params: ["timeRange"],
    keywords: ["success rate by mode", "upi success", "card failure"]
  },
];

const getCapabilityById = (id) => CAPABILITIES.find(c => c.id === id);

const searchCapabilities = (question) => {
  const q = question.toLowerCase();
  return CAPABILITIES.filter(c => 
    c.keywords.some(k => q.includes(k)) || 
    c.description.toLowerCase().includes(q)
  );
};

module.exports = { CAPABILITIES, getCapabilityById, searchCapabilities };
