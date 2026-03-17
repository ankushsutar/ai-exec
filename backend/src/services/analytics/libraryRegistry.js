/**
 * Analytics Library Registry
 * 
 * Maps library function names to their metadata (collection, description, etc.)
 * This allows the Mongo Agent to be collection-agnostic and scalable.
 */

const REGISTRY = {
  // TRANSACTION QUERIES (transactionActionHistoryInfo)
  getTotalRevenue: { collection: "transactionActionHistoryInfo" },
  getRevenueLast7Days: { collection: "transactionActionHistoryInfo" },
  getRevenueTrendPerDay: { collection: "transactionActionHistoryInfo" },
  getRevenuePerDevice: { collection: "transactionActionHistoryInfo" },
  getTransactionSuccessRate: { collection: "transactionActionHistoryInfo" },
  getFailureAnalysis: { collection: "transactionActionHistoryInfo" },
  getAverageTransactionValue: { collection: "transactionActionHistoryInfo" },
  getHourlyTransactionDistribution: { collection: "transactionActionHistoryInfo" },
  getActiveDevicesLast24h: { collection: "transactionActionHistoryInfo" },
  getTopDevicesByRevenue: { collection: "transactionActionHistoryInfo" },
  getDeviceTransactionFrequency: { collection: "transactionActionHistoryInfo" },
  getTransactionModeDistribution: { collection: "transactionActionHistoryInfo" },
  getTransactionTypeDistribution: { collection: "transactionActionHistoryInfo" },
  getLargestTransactions: { collection: "transactionActionHistoryInfo" },
  getDailyTransactionVolume: { collection: "transactionActionHistoryInfo" },
  getHighestRevenueDeviceByMonth: { collection: "transactionActionHistoryInfo" },
  getAverageRevenuePerDevice: { collection: "transactionActionHistoryInfo" },
  getDevicesWithHighestFailures: { collection: "transactionActionHistoryInfo" },
  getHighValueTransactions: { collection: "transactionActionHistoryInfo" },
  getRevenueByDayOfWeek: { collection: "transactionActionHistoryInfo" },

  // SYSTEM SUMMARIES
  getSystemSummary: { collection: "systemSummaryInfo" },

  // DEVICE STATS (deviceStatHistoryInfo)
  getNetworkQualityByOperator: { collection: "deviceStatHistoryInfo" },
  getHighNetworkFailureDevices: { collection: "deviceStatHistoryInfo" },
  getAverageDeviceUptime: { collection: "deviceStatHistoryInfo" },
  getFirmwareDistribution: { collection: "deviceStatHistoryInfo" },
  getAudioFailureDevices: { collection: "deviceStatHistoryInfo" },
  getDeviceButtonUsage: { collection: "deviceStatHistoryInfo" },
  getDataConsumptionByOperator: { collection: "deviceStatHistoryInfo" },
  getRebootAnalysis: { collection: "deviceStatHistoryInfo" },
  getLowBatteryDevices: { collection: "deviceStatHistoryInfo" },
  getStorageFailuresByFirmware: { collection: "deviceStatHistoryInfo" },
  getServerCommunicationErrors: { collection: "deviceStatHistoryInfo" },
  getUsbReliability: { collection: "deviceStatHistoryInfo" },
  getSimAndNetworkDrops: { collection: "deviceStatHistoryInfo" },
};

function getLibraryMetadata(functionName) {
  return REGISTRY[functionName];
}

module.exports = { REGISTRY, getLibraryMetadata };
