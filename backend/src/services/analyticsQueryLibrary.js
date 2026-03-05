const analyticsQueryLibrary = {
  // 1 Total revenue
  getTotalRevenue: () => [
    { $match: { actionStatus: 1, txnAmt: { $exists: true, $ne: null } } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$txnAmt" },
        count: { $sum: 1 },
      },
    },
    { $project: { _id: 0, totalRevenue: 1, count: 1 } },
  ],

  // 2 Revenue last N days from last record or current time (days defaults to 7)
  getRevenueLast7Days: (referenceDate = null, days = 7) => {
    const end = referenceDate ? new Date(referenceDate) : new Date();
    const start = new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    return [
      {
        $match: {
          actionStatus: 1,
          createdAt: { $gte: start, $lte: end },
          txnAmt: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$txnAmt" },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, totalRevenue: 1, count: 1 } },
    ];
  },

  // 3 Revenue trend per day from last record or current time
  getRevenueTrendPerDay: (days = 30, referenceDate = null) => {
    const end = referenceDate ? new Date(referenceDate) : new Date();
    const start = new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    return [
      {
        $match: {
          actionStatus: 1,
          createdAt: { $gte: start, $lte: end },
          txnAmt: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          },
          revenue: { $sum: "$txnAmt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.day": 1 } },
      { $project: { _id: 0, date: "$_id.day", revenue: 1, count: 1 } },
    ];
  },

  // 4 Revenue per device
  getRevenuePerDevice: () => [
    {
      $match: {
        actionStatus: 1,
        txnAmt: { $exists: true, $ne: null },
        deviceId: { $ne: null },
      },
    },
    {
      $group: {
        _id: "$deviceId",
        revenue: { $sum: "$txnAmt" },
        count: { $sum: 1 },
      },
    },
    { $sort: { revenue: -1 } },
    { $project: { _id: 0, deviceId: "$_id", revenue: 1, count: 1 } },
  ],

  // 5 Transaction success rate
  getTransactionSuccessRate: () => [
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        successfulTransactions: {
          $sum: { $cond: [{ $eq: ["$actionStatus", 1] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalTransactions: 1,
        successfulTransactions: 1,
        successRate: {
          $multiply: [
            { $divide: ["$successfulTransactions", "$totalTransactions"] },
            100,
          ],
        },
      },
    },
  ],

  // 6 Failure analysis
  getFailureAnalysis: () => [
    { $match: { actionStatus: { $ne: 1 } } },
    { $group: { _id: "$actionErrCode", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { _id: 0, errorCode: "$_id", count: 1 } },
  ],

  // 7 Average transaction value
  getAverageTransactionValue: () => [
    { $match: { actionStatus: 1, txnAmt: { $exists: true, $ne: null } } },
    { $group: { _id: null, avgValue: { $avg: "$txnAmt" } } },
    { $project: { _id: 0, avgValue: 1 } },
  ],

  // 8 Hourly transaction distribution
  getHourlyTransactionDistribution: () => [
    { $match: { actionStatus: 1 } },
    {
      $group: {
        _id: { hour: { $hour: "$createdAt" } },
        count: { $sum: 1 },
        revenue: { $sum: "$txnAmt" },
      },
    },
    { $sort: { "_id.hour": 1 } },
    { $project: { _id: 0, hour: "$_id.hour", count: 1, revenue: 1 } },
  ],

  // 9 Active devices last 24h
  getActiveDevicesLast24h: () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return [
      { $match: { createdAt: { $gte: oneDayAgo }, deviceId: { $ne: null } } },
      { $group: { _id: "$deviceId" } },
      { $count: "activeDevices" },
    ];
  },

  // 10 Top devices by revenue
  getTopDevicesByRevenue: (limit = 10) => [
    {
      $match: {
        actionStatus: 1,
        txnAmt: { $exists: true, $ne: null },
        deviceId: { $ne: null },
      },
    },
    {
      $group: {
        _id: "$deviceId",
        revenue: { $sum: "$txnAmt" },
        count: { $sum: 1 },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: limit },
    { $project: { _id: 0, deviceId: "$_id", revenue: 1, count: 1 } },
  ],

  // 11 Device transaction frequency
  getDeviceTransactionFrequency: () => [
    { $match: { actionStatus: 1, deviceId: { $ne: null } } },
    { $group: { _id: "$deviceId", transactionCount: { $sum: 1 } } },
    {
      $group: {
        _id: null,
        avgTransactionsPerDevice: { $avg: "$transactionCount" },
        maxTransactionsPerDevice: { $max: "$transactionCount" },
      },
    },
    {
      $project: {
        _id: 0,
        avgTransactionsPerDevice: 1,
        maxTransactionsPerDevice: 1,
      },
    },
  ],

  // 12 Transaction mode distribution
  getTransactionModeDistribution: () => [
    { $match: { actionStatus: 1, transactionMode: { $exists: true } } },
    {
      $group: {
        _id: "$transactionMode",
        count: { $sum: 1 },
        revenue: { $sum: "$txnAmt" },
      },
    },
    { $sort: { count: -1 } },
    { $project: { _id: 0, transactionMode: "$_id", count: 1, revenue: 1 } },
  ],

  // 13 Transaction type distribution
  getTransactionTypeDistribution: () => [
    { $match: { actionStatus: 1, transactionType: { $exists: true } } },
    {
      $group: {
        _id: "$transactionType",
        count: { $sum: 1 },
        revenue: { $sum: "$txnAmt" },
      },
    },
    { $sort: { count: -1 } },
    { $project: { _id: 0, transactionType: "$_id", count: 1, revenue: 1 } },
  ],

  // 14 Largest transactions
  getLargestTransactions: (limit = 10) => [
    { $match: { actionStatus: 1, txnAmt: { $exists: true, $ne: null } } },
    { $sort: { txnAmt: -1 } },
    { $limit: limit },
    { $project: { _id: 0, deviceId: 1, txnAmt: 1, createdAt: 1, reqRefNo: 1 } },
  ],

  // 15 Daily transaction volume
  getDailyTransactionVolume: (days = 30) => {
    const startDate = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
    return [
      { $match: { actionStatus: 1, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.day": 1 } },
      { $project: { _id: 0, date: "$_id.day", volume: "$count" } },
    ];
  },

  // 16 Highest revenue device by month
  getHighestRevenueDeviceByMonth: (year, month) => {
    // Note: month is 1-indexed (1 = January, 12 = December)
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));
    return [
      {
        $match: {
          actionStatus: 1,
          createdAt: { $gte: startDate, $lt: endDate },
          txnAmt: { $exists: true, $ne: null },
          deviceId: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$deviceId",
          revenue: { $sum: "$txnAmt" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 1 },
      { $project: { _id: 0, deviceId: "$_id", revenue: 1 } },
    ];
  },

  // 17 Average Revenue Per Active Device (ARPAD)
  getAverageRevenuePerDevice: () => [
    {
      $match: {
        actionStatus: 1,
        txnAmt: { $exists: true, $ne: null },
        deviceId: { $ne: null },
      },
    },
    { $group: { _id: "$deviceId", totalDeviceRevenue: { $sum: "$txnAmt" } } },
    {
      $group: {
        _id: null,
        avgRevenuePerDevice: { $avg: "$totalDeviceRevenue" },
        activeDevices: { $sum: 1 },
      },
    },
    { $project: { _id: 0, avgRevenuePerDevice: 1, activeDevices: 1 } },
  ],

  // 18 Devices with highest failure volume (Actionable Ops Metric)
  getDevicesWithHighestFailures: (limit = 10) => [
    { $match: { actionStatus: { $ne: 1 }, deviceId: { $ne: null } } },
    { $group: { _id: "$deviceId", failureCount: { $sum: 1 } } },
    { $sort: { failureCount: -1 } },
    { $limit: limit },
    { $project: { _id: 0, deviceId: "$_id", failureCount: 1 } },
  ],

  // 19 High-Value Transactions (Risk/VIP Monitoring)
  getHighValueTransactions: (threshold = 10000, limit = 20) => [
    { $match: { actionStatus: 1, txnAmt: { $gte: threshold } } },
    { $sort: { txnAmt: -1, createdAt: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        deviceId: 1,
        txnAmt: 1,
        createdAt: 1,
        transactionMode: 1,
      },
    },
  ],

  // 20 Revenue by Day of Week (Operational staffing/marketing)
  getRevenueByDayOfWeek: () => [
    { $match: { actionStatus: 1, txnAmt: { $exists: true, $ne: null } } },
    {
      $group: {
        _id: { dayOfWeek: { $dayOfWeek: "$createdAt" } },
        revenue: { $sum: "$txnAmt" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.dayOfWeek": 1 } },
    { $project: { _id: 0, dayOfWeek: "$_id.dayOfWeek", revenue: 1, count: 1 } },
  ],

  // 21 Overall System Summary
  getSystemSummary: () => [
    { $sort: { createdAt: -1 } },
    { $limit: 1 },
    {
      $project: {
        _id: 0,
        totalTransactionAmount: 1,
        totalTransactionsCount: 1,
        totalSuccessfulTransactionsCount: 1,
        totalAdvertisementsCount: 1,
        maxTransactionAmount: 1,
      },
    },
  ],
};

module.exports = analyticsQueryLibrary;
