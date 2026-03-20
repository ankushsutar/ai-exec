const analyticsQueryLibrary = {
  // Helper for consistent date filtering across all functions
  _getRangeMatch: (range) => {
    if (range && range.start && range.end) {
      return { $gte: new Date(range.start), $lte: new Date(range.end) };
    }
    return null;
  },

  // 1 Total revenue
  getTotalRevenue: (range = null) => {
    const match = { actionStatus: 1, txnAmt: { $exists: true, $ne: null } };
    const dateFilter = analyticsQueryLibrary._getRangeMatch(range);
    if (dateFilter) match.createdAt = dateFilter;

    return [
      { $match: match },
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

  // 2 Revenue last N days from last record or current time (days defaults to 7)
  getRevenueLast7Days: (range = null, referenceDate = null, days = 7) => {
    const match = { actionStatus: 1, txnAmt: { $exists: true, $ne: null } };
    const dateFilter = analyticsQueryLibrary._getRangeMatch(range);
    if (dateFilter) {
      match.createdAt = dateFilter;
    } else {
      const end = referenceDate ? new Date(referenceDate) : new Date();
      const start = new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
      match.createdAt = { $gte: start, $lte: end };
    }

    return [
      { $match: match },
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
  getRevenueTrendPerDay: (range = null, days = 30, referenceDate = null) => {
    const match = { actionStatus: 1, txnAmt: { $exists: true, $ne: null } };
    const dateFilter = analyticsQueryLibrary._getRangeMatch(range);
    if (dateFilter) {
      match.createdAt = dateFilter;
    } else {
      const end = referenceDate ? new Date(referenceDate) : new Date();
      const start = new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
      match.createdAt = { $gte: start, $lte: end };
    }

    return [
      { $match: match },
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
  getRevenuePerDevice: (range = null) => {
    const match = {
      actionStatus: 1,
      txnAmt: { $exists: true, $ne: null },
      deviceId: { $ne: null },
    };
    const dateFilter = analyticsQueryLibrary._getRangeMatch(range);
    if (dateFilter) match.createdAt = dateFilter;

    return [
      { $match: match },
      {
        $group: {
          _id: "$deviceId",
          revenue: { $sum: "$txnAmt" },
          count: { $sum: 1 },
          lastTransactionDate: { $max: "$createdAt" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 100 },
      {
        $project: {
          _id: 0,
          deviceId: "$_id",
          revenue: 1,
          count: 1,
          date: "$lastTransactionDate",
        },
      },
    ];
  },

  // 5 Transaction success rate
  getTransactionSuccessRate: (range = null) => {
    const match = {};
    const dateFilter = analyticsQueryLibrary._getRangeMatch(range);
    if (dateFilter) match.createdAt = dateFilter;

    return [
      { $match: match },
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
              {
                $divide: [
                  "$successfulTransactions",
                  { $cond: [{ $eq: ["$totalTransactions", 0] }, 1, "$totalTransactions"] },
                ],
              },
              100,
            ],
          },
        },
      },
    ];
  },

  // 6 Failure analysis
  getFailureAnalysis: (range = null) => {
    const match = { actionStatus: { $ne: 1 } };
    const dateFilter = analyticsQueryLibrary._getRangeMatch(range);
    if (dateFilter) match.createdAt = dateFilter;

    return [
      { $match: match },
      { $group: { _id: "$actionErrCode", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, errorCode: "$_id", count: 1 } },
    ];
  },

  // 7 Average transaction value (optionally filtered by range)
  getAverageTransactionValue: (range = null) => {
    const match = { actionStatus: 1, txnAmt: { $exists: true, $ne: null } };
    const dateFilter = analyticsQueryLibrary._getRangeMatch(range);
    if (dateFilter) match.createdAt = dateFilter;
    return [
      { $match: match },
      { $group: { _id: null, avgValue: { $avg: "$txnAmt" } } },
      { $project: { _id: 0, avgValue: 1 } },
    ];
  },

  // 8 Hourly transaction distribution
  getHourlyTransactionDistribution: (range = null) => {
    const match = { actionStatus: 1 };
    const dateFilter = analyticsQueryLibrary._getRangeMatch(range);
    if (dateFilter) match.createdAt = dateFilter;

    return [
      { $match: match },
      {
        $group: {
          _id: { hour: { $hour: "$createdAt" } },
          count: { $sum: 1 },
          revenue: { $sum: "$txnAmt" },
        },
      },
      { $sort: { "_id.hour": 1 } },
      { $project: { _id: 0, hour: "$_id.hour", count: 1, revenue: 1 } },
    ];
  },

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
  getTopDevicesByRevenue: (limit = 10, range = null) => {
    const match = {
      actionStatus: 1,
      txnAmt: { $exists: true, $ne: null },
      deviceId: { $ne: null },
    };
    const dateFilter = analyticsQueryLibrary._getRangeMatch(range);
    if (dateFilter) match.createdAt = dateFilter;

    return [
      { $match: match },
      {
        $group: {
          _id: "$deviceId",
          revenue: { $sum: "$txnAmt" },
          count: { $sum: 1 },
          lastTransactionDate: { $max: "$createdAt" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          deviceId: "$_id",
          revenue: 1,
          count: 1,
          date: "$lastTransactionDate",
        },
      },
    ];
  },

  // 11 Device transaction frequency
  getDeviceTransactionFrequency: () => [
    { $match: { actionStatus: 1, deviceId: { $ne: null } } },
    { $sort: { transactionCount: -1 } },
    { $limit: 100 },
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
  getTransactionModeDistribution: (range = null) => {
    const match = { actionStatus: 1, transactionMode: { $exists: true } };
    const dateFilter = analyticsQueryLibrary._getRangeMatch(range);
    if (dateFilter) match.createdAt = dateFilter;

    return [
      { $match: match },
      {
        $group: {
          _id: "$transactionMode",
          count: { $sum: 1 },
          revenue: { $sum: "$txnAmt" },
        },
      },
      { $sort: { count: -1 } },
      { $project: { _id: 0, transactionMode: "$_id", count: 1, revenue: 1 } },
    ];
  },

  // 13 Transaction type distribution
  getTransactionTypeDistribution: (range = null) => {
    const match = { actionStatus: 1, transactionType: { $exists: true } };
    const dateFilter = analyticsQueryLibrary._getRangeMatch(range);
    if (dateFilter) match.createdAt = dateFilter;

    return [
      { $match: match },
      {
        $group: {
          _id: "$transactionType",
          count: { $sum: 1 },
          revenue: { $sum: "$txnAmt" },
        },
      },
      { $sort: { count: -1 } },
      { $project: { _id: 0, transactionType: "$_id", count: 1, revenue: 1 } },
    ];
  },

  // 14 Individual Top Transactions (Records)
  getLargestTransactions: (limit = 10, range = null) => {
    const match = { actionStatus: 1, txnAmt: { $exists: true, $ne: null } };
    const dateFilter = analyticsQueryLibrary._getRangeMatch(range);
    if (dateFilter) match.createdAt = dateFilter;

    return [
      { $match: match },
      { $sort: { txnAmt: -1 } },
      { $limit: limit },
      {
        $project: { _id: 0, deviceId: 1, txnAmt: 1, createdAt: 1, reqRefNo: 1 },
      },
    ];
  },

  // 15 Daily transaction volume
  getDailyTransactionVolume: (range = null) => {
    const match = { actionStatus: 1 };
    const dateFilter = analyticsQueryLibrary._getRangeMatch(range);
    if (dateFilter) match.createdAt = dateFilter;

    return [
      { $match: match },
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

  getHighestRevenueDeviceByMonth: (limit = 1, year = null, month = null) => {
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
          lastTransactionDate: { $max: "$createdAt" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 1 },
      {
        $project: {
          _id: 0,
          deviceId: "$_id",
          revenue: 1,
          date: "$lastTransactionDate",
        },
      },
    ];
  },

  // 17 Average Revenue Per Active Device (ARPAD)
  getAverageRevenuePerDevice: (range = null) => {
    const match = {
      actionStatus: 1,
      txnAmt: { $exists: true, $ne: null },
      deviceId: { $ne: null },
    };
    const dateFilter = analyticsQueryLibrary._getRangeMatch(range);
    if (dateFilter) match.createdAt = dateFilter;

    return [
      { $match: match },
      { $group: { _id: "$deviceId", totalDeviceRevenue: { $sum: "$txnAmt" } } },
      {
        $group: {
          _id: null,
          avgRevenuePerDevice: { $avg: "$totalDeviceRevenue" },
          activeDevices: { $sum: 1 },
        },
      },
      { $project: { _id: 0, avgRevenuePerDevice: 1, activeDevices: 1 } },
    ];
  },

  // 18 Devices with highest failure volume
  getDevicesWithHighestFailures: (limit = 10, range = null) => {
    const match = { actionStatus: { $ne: 1 }, deviceId: { $ne: null } };
    const dateFilter = analyticsQueryLibrary._getRangeMatch(range);
    if (dateFilter) match.createdAt = dateFilter;

    return [
      { $match: match },
      {
        $group: {
          _id: "$deviceId",
          failureCount: { $sum: 1 },
          lastFailureDate: { $max: "$createdAt" },
        },
      },
      { $sort: { failureCount: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          deviceId: "$_id",
          failureCount: 1,
          date: "$lastFailureDate",
        },
      },
    ];
  },

  // 19 High-Value Transactions (Risk/VIP Monitoring)
  getHighValueTransactions: (threshold = 10000, limit = 20, range = null) => {
    const match = { actionStatus: 1, txnAmt: { $gte: threshold } };
    const dateFilter = analyticsQueryLibrary._getRangeMatch(range);
    if (dateFilter) match.createdAt = dateFilter;

    return [
      { $match: match },
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
    ];
  },

  // 20 Revenue by Day of Week
  getRevenueByDayOfWeek: (range = null) => {
    const match = { actionStatus: 1, txnAmt: { $exists: true, $ne: null } };
    const dateFilter = analyticsQueryLibrary._getRangeMatch(range);
    if (dateFilter) match.createdAt = dateFilter;

    return [
      { $match: match },
      {
        $group: {
          _id: { dayOfWeek: { $dayOfWeek: "$createdAt" } },
          revenue: { $sum: "$txnAmt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.dayOfWeek": 1 } },
      { $project: { _id: 0, dayOfWeek: "$_id.dayOfWeek", revenue: 1, count: 1 } },
    ];
  },

  // 21 Average Audio Playback Latency
  getAverageAudioLatency: (range = null) => {
    const match = { actionStatus: 20, tMsgTimeElapsed: { $exists: true, $ne: null } };
    const dateFilter = analyticsQueryLibrary._getRangeMatch(range);
    if (dateFilter) match.createdAt = dateFilter;

    return [
      { $match: match },
      {
        $group: {
          _id: null,
          avgLatencyMs: { $avg: "$tMsgTimeElapsed" },
          maxLatencyMs: { $max: "$tMsgTimeElapsed" },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, avgLatencyMs: 1, maxLatencyMs: 1, count: 1 } },
    ];
  },

  // 22 Success Rate by Transaction Mode
  getSuccessRateByMode: (range = null) => {
    const match = {};
    const dateFilter = analyticsQueryLibrary._getRangeMatch(range);
    if (dateFilter) match.createdAt = dateFilter;

    return [
      { $match: match },
      {
        $group: {
          _id: { actionId: "$actionId", mode: "$transactionMode" },
          hasSent: { $max: { $cond: [{ $eq: ["$actionStatus", 1] }, 1, 0] } },
          hasResponse: { $max: { $cond: [{ $eq: ["$actionStatus", 20] }, 1, 0] } },
        },
      },
      { $match: { "_id.mode": { $ne: null } } },
      {
        $group: {
          _id: "$_id.mode",
          totalRequests: { $sum: "$hasSent" },
          totalResponses: { $sum: "$hasResponse" },
        },
      },
      {
        $project: {
          _id: 0,
          transactionMode: "$_id",
          totalRequests: 1,
          totalResponses: 1,
          successRate: {
            $cond: [
              { $eq: ["$totalRequests", 0] },
              0,
              { $multiply: [{ $divide: ["$totalResponses", "$totalRequests"] }, 100] },
            ],
          },
        },
      },
      { $sort: { successRate: -1 } },
    ];
  },

  // 23 Overall System Summary
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

  // ── DEVICE STATS (deviceStatHistoryInfo) ───────────────────────────────────

  // 22 Network Quality by Operator
  getNetworkQualityByOperator: (limit = 10) => [
    { $match: { operatorName: { $exists: true, $ne: "" } } },
    {
      $group: {
        _id: "$operatorName",
        avgSignalStrength: { $avg: "$signalStrength" },
        avgRsrp: { $avg: "$rsrp" },
        avgRxlev: { $avg: "$rxlev" },
        deviceCount: { $sum: 1 },
      },
    },
    { $sort: { deviceCount: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        operatorName: "$_id",
        avgSignalStrength: 1,
        avgRsrp: { $round: ["$avgRsrp", 2] },
        avgRxlev: { $round: ["$avgRxlev", 2] },
        deviceCount: 1,
      },
    },
  ],

  // 23 High Network Failure Devices
  getHighNetworkFailureDevices: (limit = 10) => [
    {
      $match: {
        totalNWFailureCount: { $gt: 0 },
        "metadata.deviceId": { $ne: null },
      },
    },
    {
      $group: {
        _id: "$metadata.deviceId",
        totalNetworkFailures: { $max: "$totalNWFailureCount" },
        maxNetworkErrors: { $max: "$networkQualityBitErr" },
      },
    },
    { $sort: { totalNetworkFailures: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        deviceId: "$_id",
        totalNetworkFailures: 1,
        maxNetworkErrors: 1,
      },
    },
  ],

  // 24 Average Device Uptime
  getAverageDeviceUptime: () => [
    { $match: { deviceUptime: { $exists: true, $ne: null } } },
    {
      $group: {
        _id: null,
        avgUptimeSeconds: { $avg: "$deviceUptime" },
        maxUptimeSeconds: { $max: "$deviceUptime" },
        reportingDevices: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        avgUptimeHours: { $divide: ["$avgUptimeSeconds", 3600] },
        maxUptimeHours: { $divide: ["$maxUptimeSeconds", 3600] },
        reportingDevices: 1,
      },
    },
  ],

  // 25 Firmware Distribution
  getFirmwareDistribution: () => [
    { $match: { deviceModemFirmWareName: { $exists: true, $ne: "" } } },
    {
      $group: {
        _id: "$deviceModemFirmWareName",
        deviceCount: { $sum: 1 },
      },
    },
    { $sort: { deviceCount: -1 } },
    { $project: { _id: 0, firmwareVersion: "$_id", deviceCount: 1 } },
  ],

  // 26 Audio Failure Devices
  getAudioFailureDevices: (limit = 10) => [
    {
      $match: {
        totalTransactionsFailedToPlay: { $gt: 0 },
        "metadata.deviceId": { $ne: null },
      },
    },
    {
      $group: {
        _id: "$metadata.deviceId",
        totalFailedToPlay: { $max: "$totalTransactionsFailedToPlay" },
        totalPlayed: { $max: "$totalTransactionsPlayed" },
        lastReported: { $max: "$createdAt" },
      },
    },
    { $sort: { totalFailedToPlay: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        deviceId: "$_id",
        totalFailedToPlay: 1,
        totalPlayed: 1,
        date: "$lastReported",
      },
    },
  ],

  // 27 Device Button Usage
  getDeviceButtonUsage: () => [
    {
      $group: {
        _id: null,
        totalVolumeUp: { $sum: "$volumeUpPressCounts" },
        totalVolumeDown: { $sum: "$volumeDownPressCounts" },
        totalReplays: { $sum: "$replayPressCounts" },
      },
    },
    {
      $project: {
        _id: 0,
        totalVolumeUp: 1,
        totalVolumeDown: 1,
        totalReplays: 1,
      },
    },
  ],

  // 28 Data Consumption by Operator
  getDataConsumptionByOperator: () => [
    { $match: { operatorName: { $exists: true, $ne: "" } } },
    {
      $group: {
        _id: "$operatorName",
        totalTxBytes: { $sum: "$totalTxTrafficConsumed" },
        totalRxBytes: { $sum: "$totalRxTrafficConsumed" },
      },
    },
    { $sort: { totalRxBytes: -1 } },
    {
      $project: {
        _id: 0,
        operatorName: "$_id",
        totalTxMB: { $divide: ["$totalTxBytes", 1048576] },
        totalRxMB: { $divide: ["$totalRxBytes", 1048576] },
      },
    },
  ],

  // 29 Reboot Analysis
  getRebootAnalysis: (limit = 10) => [
    {
      $match: {
        totalDeviceRebootCount: { $gt: 0 },
        "metadata.deviceId": { $ne: null },
      },
    },
    {
      $group: {
        _id: "$metadata.deviceId",
        totalReboots: { $max: "$totalDeviceRebootCount" },
        lastRebootReason: { $last: "$deviceLastRebootReason" },
        lastRebootDate: { $max: "$createdAt" },
      },
    },
    { $sort: { totalReboots: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        deviceId: "$_id",
        totalReboots: 1,
        lastRebootReason: 1,
        date: "$lastRebootDate",
      },
    },
  ],

  // 30 Low Battery Devices
  getLowBatteryDevices: (limit = 10, threshold = 20) => [
    {
      $match: {
        batteryLevel: { $lt: threshold, $gt: 0 },
        "metadata.deviceId": { $ne: null },
      },
    },
    { $sort: { batteryLevel: 1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        deviceId: "$metadata.deviceId",
        batteryLevel: 1,
        chargingStatus: 1,
      },
    },
  ],

  // 31 Storage & Download Failures by Firmware
  getStorageFailuresByFirmware: () => [
    {
      $match: {
        deviceModemFirmWareName: { $ne: "" },
        $or: [
          { flashFileReadFailCount: { $gt: 0 } },
          { flashFileWriteFailCount: { $gt: 0 } },
          { httpDownloadFailCount: { $gt: 0 } },
        ],
      },
    },
    {
      $group: {
        _id: "$deviceModemFirmWareName",
        totalReadFails: { $sum: "$flashFileReadFailCount" },
        totalWriteFails: { $sum: "$flashFileWriteFailCount" },
        totalDownloadFails: { $sum: "$httpDownloadFailCount" },
      },
    },
    { $sort: { totalDownloadFails: -1, totalWriteFails: -1 } },
    {
      $project: {
        _id: 0,
        firmware: "$_id",
        totalReadFails: 1,
        totalWriteFails: 1,
        totalDownloadFails: 1,
      },
    },
  ],

  // 32 Server Communication Errors
  getServerCommunicationErrors: (limit = 10) => [
    {
      $match: {
        $or: [
          { httpPostFailCount: { $gt: 0 } },
          { mqttConnectionFailCount: { $gt: 0 } },
        ],
        "metadata.deviceId": { $ne: null },
      },
    },
    {
      $group: {
        _id: "$metadata.deviceId",
        httpFails: { $max: "$httpPostFailCount" },
        mqttFails: { $max: "$mqttConnectionFailCount" },
      },
    },
    { $sort: { mqttFails: -1, httpFails: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        deviceId: "$_id",
        httpFails: 1,
        mqttFails: 1,
      },
    },
  ],

  // 33 USB Port Reliability
  getUsbReliability: (limit = 10) => [
    {
      $match: {
        totalUSBPluginCount: { $gt: 0 },
        "metadata.deviceId": { $ne: null },
      },
    },
    {
      $group: {
        _id: "$metadata.deviceId",
        totalUSBPlugins: { $max: "$totalUSBPluginCount" },
        avgPluginDuration: { $avg: "$totalUSBPluginDuration" },
      },
    },
    { $sort: { totalUSBPlugins: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        deviceId: "$_id",
        totalUSBPlugins: 1,
        avgPluginDuration: { $round: ["$avgPluginDuration", 0] },
      },
    },
  ],

  // 34 SIM and Network Drops
  getSimAndNetworkDrops: (limit = 10) => [
    {
      $match: {
        $or: [
          { totalNWDiscDueToBadRSSICount: { $gt: 0 } },
          { totalSIMInsertedCount: { $gt: 0 } },
        ],
        "metadata.deviceId": { $ne: null },
      },
    },
    {
      $group: {
        _id: "$metadata.deviceId",
        networkDrops: { $max: "$totalNWDiscDueToBadRSSICount" },
        simSwaps: { $max: "$totalSIMInsertedCount" },
      },
    },
    { $sort: { networkDrops: -1, simSwaps: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        deviceId: "$_id",
        networkDrops: 1,
        simSwaps: 1,
      },
    },
  ],
  // 35 Generalized Aggregate (Dynamic Dimensions & Metrics)
  getGeneralizedAggregate: (metric = "revenue", dimension = "deviceId", threshold = null, operator = "gt", limit = 10, range = null) => {
    const match = { actionStatus: 1 };
    const dateFilter = analyticsQueryLibrary._getRangeMatch(range);
    if (dateFilter) match.createdAt = dateFilter;

    const metricMap = {
      revenue: { $sum: "$txnAmt" },
      volume: { $sum: 1 },
      transactionCount: { $sum: 1 },
      avg_value: { $avg: "$txnAmt" },
      avg_ticket_size: { $avg: "$txnAmt" },
      latency: { $avg: "$tMsgTimeElapsed" },
    };

    const groupField = dimension === "hour" ? { hour: { $hour: "$createdAt" } } : `$${dimension}`;
    const valueKey = metric === "revenue" ? "revenue" : metric === "volume" ? "count" : metric;

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: groupField,
          [valueKey]: metricMap[metric] || metricMap.revenue,
          lastDate: { $max: "$createdAt" },
        },
      },
    ];

    // Add threshold filtering (HAVING clause)
    if (threshold !== null && threshold !== undefined && threshold !== "null") {
      const mongoOp = operator === "lt" ? "$lt" : operator === "lte" ? "$lte" : operator === "gt" ? "$gt" : "$gte";
      pipeline.push({ $match: { [valueKey]: { [mongoOp]: Number(threshold) } } });
    }

    pipeline.push({ $sort: { [valueKey]: -1 } });
    if (limit && limit !== "null") pipeline.push({ $limit: Number(limit) });

    pipeline.push({
      $project: {
        _id: 0,
        [dimension]: "$_id",
        [valueKey]: 1,
        date: "$lastDate",
      },
    });

    return pipeline;
  },
};

module.exports = analyticsQueryLibrary;
