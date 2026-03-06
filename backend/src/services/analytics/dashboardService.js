const { connect: connectMongo } = require("../data/mongoService");
const analyticsQueryLibrary = require("./analyticsQueryLibrary");

/**
 * Executes a specific aggregation query from the library.
 */
async function executeAnalyticsQuery(collectionName, pipeline) {
  try {
    const db = await connectMongo();
    const collection = db.collection(collectionName);
    return await collection.aggregate(pipeline).toArray();
  } catch (error) {
    console.error(
      `[Analytics Engine] Error executing query on ${collectionName}:`,
      error.message,
    );
    return [];
  }
}

const analyticsEngine = {
  /**
   * Automatically extracts core KPIs.
   * Ready for frontend consumption.
   */
  getDashboardMetrics: async () => {
    console.log("[Analytics Engine] Extracting dashboard metrics...");

    // 1. Executive Metrics (Promises in parallel)
    const [
      totalRevenueRes,
      revenueTodayRes,
      activeDevicesRes,
      successRateRes,
      dailyTrendsRes,
      topDevicesRes,
    ] = await Promise.all([
      executeAnalyticsQuery(
        "transactionActionHistoryInfo",
        analyticsQueryLibrary.getTotalRevenue(),
      ),
      executeAnalyticsQuery(
        "transactionActionHistoryInfo",
        analyticsQueryLibrary.getDailyTransactionVolume(1),
      ),
      executeAnalyticsQuery(
        "transactionActionHistoryInfo",
        analyticsQueryLibrary.getActiveDevicesLast24h(),
      ),
      executeAnalyticsQuery(
        "transactionActionHistoryInfo",
        analyticsQueryLibrary.getTransactionSuccessRate(),
      ),
      executeAnalyticsQuery(
        "transactionActionHistoryInfo",
        analyticsQueryLibrary.getRevenueTrendPerDay(30),
      ),
      executeAnalyticsQuery(
        "transactionActionHistoryInfo",
        analyticsQueryLibrary.getTopDevicesByRevenue(5),
      ),
    ]);

    // 2. Operational Metrics
    const [failedTransactionsRes, networkQualityRes] = await Promise.all([
      executeAnalyticsQuery(
        "transactionActionHistoryInfo",
        analyticsQueryLibrary.getFailureAnalysis(),
      ),
      // Query device stat for network quality
      executeAnalyticsQuery("deviceStatHistoryInfo", [
        { $match: { networkQualityBitErr: { $exists: true, $ne: null } } },
        {
          $group: { _id: null, avgBitError: { $avg: "$networkQualityBitErr" } },
        },
      ]),
    ]);

    // Formatting for Frontend Charts
    return {
      executive: {
        totalRevenue: totalRevenueRes[0]?.totalRevenue || 0,
        transactionsToday: revenueTodayRes[0]?.volume || 0,
        activeDevices: activeDevicesRes[0]?.activeDevices || 0,
        successRatePercentage: successRateRes[0]?.successRate
          ? Number(successRateRes[0].successRate.toFixed(2))
          : 0,
        topDevices: topDevicesRes,
        dailyTrends: {
          labels: dailyTrendsRes.map((d) => d.date),
          datasets: [
            { label: "Revenue", data: dailyTrendsRes.map((d) => d.revenue) },
            { label: "Transactions", data: dailyTrendsRes.map((d) => d.count) },
          ],
        },
      },
      operational: {
        failureRates: failedTransactionsRes.map((f) => ({
          errorCode: f.errorCode,
          count: f.count,
        })),
        networkQuality: {
          averageBitErrorRate: networkQualityRes[0]?.avgBitError
            ? Number(networkQualityRes[0].avgBitError.toFixed(2))
            : 0,
        },
      },
    };
  },
};

module.exports = analyticsEngine;
