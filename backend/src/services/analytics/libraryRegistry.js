/**
 * Analytics Library Registry
 * 
 * Maps library function names to their metadata (collection, description, etc.)
 * This allows the Mongo Agent to be collection-agnostic and scalable.
 */

const REGISTRY = {
  // TRANSACTION QUERIES (transactionActionHistoryInfo)
  getTotalRevenue: { 
    collection: "transactionActionHistoryInfo",
    purpose: "Total Amount (Sum of txnAmt) for specific months, years, or all time.",
    params: ["year", "month"]
  },
  getRevenueLast7Days: { 
    collection: "transactionActionHistoryInfo",
    purpose: "Total Amount (Sum of txnAmt) for the last 7 days or a 7-day window.",
    params: ["referenceDate", "days", "year", "month"]
  },
  getRevenueTrendPerDay: { 
    collection: "transactionActionHistoryInfo",
    purpose: "Daily Amount (Sum of txnAmt) trends/graphs for the last 30 days.",
    params: ["days", "referenceDate", "year", "month"]
  },
  getRevenuePerDevice: { 
    collection: "transactionActionHistoryInfo",
    purpose: "Total Amount (Sum of txnAmt) per unique device ID, sorted by highest.",
    params: ["year", "month"]
  },
  getTransactionSuccessRate: { 
    collection: "transactionActionHistoryInfo",
    purpose: "Success Count percentage (Network success) vs Failure Count.",
    params: ["year", "month"]
  },
  getFailureAnalysis: { 
    collection: "transactionActionHistoryInfo",
    purpose: "Count of failures grouped by error codes and reasons.",
    params: ["year", "month"]
  },
  getAverageTransactionValue: { 
    collection: "transactionActionHistoryInfo",
    purpose: "Average Amount (Mean txnAmt) per transaction or ticket size.",
    params: ["year", "month"]
  },
  getHourlyTransactionDistribution: { 
    collection: "transactionActionHistoryInfo",
    purpose: "Count of transactions per hour (hourly heat map/distribution).",
    params: ["year", "month"]
  },
  getActiveDevicesLast24h: { 
    collection: "transactionActionHistoryInfo",
    purpose: "Count of unique active devices in the last 24 hours.",
    params: []
  },
  getTopDevicesByRevenue: { 
    collection: "transactionActionHistoryInfo",
    purpose: "Top N devices ranked by Total Amount (Sum of txnAmt).",
    params: ["limit", "year", "month"]
  },
  getDeviceTransactionFrequency: { 
    collection: "transactionActionHistoryInfo",
    purpose: "Frequency Count (average transactions per device).",
    params: ["year", "month"]
  },
  getTransactionModeDistribution: { 
    collection: "transactionActionHistoryInfo",
    purpose: "Amount (Sum of txnAmt) and Count grouped by Mode (UPI, Card, etc).",
    params: ["year", "month"]
  },
  getTransactionTypeDistribution: { 
    collection: "transactionActionHistoryInfo",
    purpose: "Amount (Sum of txnAmt) and Count grouped by Type (Sale, Refund).",
    params: ["year", "month"]
  },
  getLargestTransactions: { 
    collection: "transactionActionHistoryInfo",
    purpose: "List of individual transactions with the largest Amount (txnAmt).",
    params: ["limit", "year", "month"]
  },
  getDailyTransactionVolume: { 
    collection: "transactionActionHistoryInfo",
    purpose: "Count (Number of transactions) per day (Transaction Volume trend).",
    params: ["year", "month", "days"]
  },
  getHighestRevenueDeviceByMonth: { 
    collection: "transactionActionHistoryInfo",
    purpose: "Identify the single best performing device for a specific month/year.",
    params: ["limit", "year", "month"]
  },
  getAverageRevenuePerDevice: { 
    collection: "transactionActionHistoryInfo",
    purpose: "Metric for ARPAD (Average Revenue Per Active Device).",
    params: ["year", "month"]
  },
  getDevicesWithHighestFailures: { 
    collection: "transactionActionHistoryInfo",
    purpose: "Operational alert for devices that are failing transactions frequently.",
    params: ["limit", "year", "month"]
  },
  getHighValueTransactions: { 
    collection: "transactionActionHistoryInfo",
    purpose: "Filter for transactions above a specific amount threshold.",
    params: ["threshold", "limit", "year", "month"]
  },
  getRevenueByDayOfWeek: { 
    collection: "transactionActionHistoryInfo",
    purpose: "Compare revenue across days of the week (Monday vs Sunday, etc).",
    params: ["year", "month"]
  },
  getAverageAudioLatency: { 
    collection: "transactionActionHistoryInfo",
    purpose: "Metric for average audio playback delay in milliseconds.",
    params: ["year", "month"]
  },
  getSuccessRateByMode: { 
    collection: "transactionActionHistoryInfo",
    purpose: "Analyze success rates across different transaction modes (UPI, Card, etc).",
    params: ["year", "month"]
  },

  // SYSTEM SUMMARIES
  getSystemSummary: { 
    collection: "systemSummaryInfo",
    purpose: "Get high-level system overview including total revenue, transactions, and ads count.",
    params: []
  },

  // DEVICE STATS (deviceStatHistoryInfo)
  getNetworkQualityByOperator: { 
    collection: "deviceStatHistoryInfo",
    purpose: "Compare signal strength, RSRP, and RXLEV across different ISP/operators.",
    params: ["limit"]
  },
  getHighNetworkFailureDevices: { 
    collection: "deviceStatHistoryInfo",
    purpose: "Identify devices with frequent network disconnects or high bit error rates.",
    params: ["limit"]
  },
  getAverageDeviceUptime: { 
    collection: "deviceStatHistoryInfo",
    purpose: "Calculate mean uptime for the entire device fleet.",
    params: []
  },
  getFirmwareDistribution: { 
    collection: "deviceStatHistoryInfo",
    purpose: "See which firmware versions are installed across the device population.",
    params: []
  },
  getAudioFailureDevices: { 
    collection: "deviceStatHistoryInfo",
    purpose: "Identify devices that are failing to play audio transaction alerts.",
    params: ["limit"]
  },
  getDeviceButtonUsage: { 
    collection: "deviceStatHistoryInfo",
    purpose: "Stats on physical button presses (Volume Up/Down, Replay).",
    params: []
  },
  getDataConsumptionByOperator: { 
    collection: "deviceStatHistoryInfo",
    purpose: "Network traffic (TX/RX MBs) consumed per mobile operator.",
    params: []
  },
  getRebootAnalysis: { 
    collection: "deviceStatHistoryInfo",
    purpose: "Track total reboots and last reboot reasons across devices.",
    params: ["limit"]
  },
  getLowBatteryDevices: { 
    collection: "deviceStatHistoryInfo",
    purpose: "Operational list of devices with battery levels below a threshold.",
    params: ["limit", "threshold"]
  },
  getStorageFailuresByFirmware: { 
    collection: "deviceStatHistoryInfo",
    purpose: "Correlate flash read/write failures with specific firmware versions.",
    params: []
  },
  getServerCommunicationErrors: { 
    collection: "deviceStatHistoryInfo",
    purpose: "MQTT and HTTP communication failure counts per device.",
    params: ["limit"]
  },
  getUsbReliability: { 
    collection: "deviceStatHistoryInfo",
    purpose: "Track USB plugin counts and durations per device.",
    params: ["limit"]
  },
  getSimAndNetworkDrops: { 
    collection: "deviceStatHistoryInfo",
    purpose: "Correlate SIM swaps with bad network signal drops.",
    params: ["limit"]
  },
};

function getLibraryMetadata(functionName) {
  return REGISTRY[functionName];
}

module.exports = { REGISTRY, getLibraryMetadata };
