const { generateSQLFromPrompt } = require("./sqlAgent");
const { executeDynamicQuery } = require("./dbService");
const { connect: connectMongo } = require("./mongoService");
const { generateMQLFromPrompt } = require("./mongoAgent");
const { dispatchIntent } = require("./intentDispatcher");
const { extractBIParams } = require("./biParamExtractor");

/**
 * The Intelligent Broker that orchestrates across Postgres and MongoDB.
 */
async function orchestrateHybridQuery(question, requestId) {
  console.log(`[Hybrid Broker] Orchestrating query for #${requestId}`);

  // STEP 1: Determine intent using LLM (Intelligent Dispatcher)
  let intent = await dispatchIntent(question);

  if (!intent) {
    // Fallback heuristic if LLM fails
    const lowercaseQ = question.toLowerCase();
    intent =
      (lowercaseQ.includes("merchant") ||
        lowercaseQ.includes("user") ||
        lowercaseQ.includes("device")) &&
      (lowercaseQ.includes("transaction") ||
        lowercaseQ.includes("revenue") ||
        lowercaseQ.includes("volume") ||
        lowercaseQ.includes("history"))
        ? "HYBRID"
        : "SQL";
    console.log(`[Hybrid Broker] Fallback Heuristic Intent: ${intent}`);
  }

  if (intent === "SQL") {
    console.log("[Hybrid Broker] SQL primary intent detected.");
    let sql = await generateSQLFromPrompt(question);
    try {
      return await executeDynamicQuery(sql);
    } catch (error) {
      console.warn("[Hybrid Broker] SQL failed, attempting self-correction...");
      const { fixSQLFromError } = require("./sqlAgent");
      const fixedSql = await fixSQLFromError(question, sql, error.message);
      return await executeDynamicQuery(fixedSql);
    }
  }

  if (intent && intent.startsWith("MONGODB_BI_")) {
    console.log(`[Hybrid Broker] Direct BI Library bypass detected: ${intent}`);
    const analyticsQueryLibrary = require("./analyticsQueryLibrary");
    const db = await connectMongo();

    // Look for the latest successful transaction to anchor "Last X days" queries
    // This ensures we get data even if the demo database hasn't been updated recently.
    const latestTxn = await db
      .collection("transactionActionHistoryInfo")
      .find({ actionStatus: 1 })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();
    const referenceDate = latestTxn.length > 0 ? latestTxn[0].createdAt : null;

    // Extract dynamic parameters from the user's natural language question
    const biParams = extractBIParams(question, referenceDate);
    const { days, limit, threshold, year, month } = biParams;
    console.log(`[Hybrid Broker] BI Params extracted:`, biParams);

    let pipeline = [];
    let collectionName = "transactionActionHistoryInfo";

    switch (intent) {
      case "MONGODB_BI_TOTAL_REV":
        pipeline = analyticsQueryLibrary.getTotalRevenue();
        break;
      case "MONGODB_BI_REV_7D":
        pipeline = analyticsQueryLibrary.getRevenueLast7Days(
          referenceDate,
          days,
        );
        break;
      case "MONGODB_BI_REV_TREND":
        pipeline = analyticsQueryLibrary.getRevenueTrendPerDay(
          days,
          referenceDate,
        );
        break;
      case "MONGODB_BI_REV_PER_DEVICE":
        pipeline = analyticsQueryLibrary.getRevenuePerDevice();
        break;
      case "MONGODB_BI_SUCCESS_RATE":
        pipeline = analyticsQueryLibrary.getTransactionSuccessRate();
        break;
      case "MONGODB_BI_FAILURE_ANALYSIS":
        pipeline = analyticsQueryLibrary.getFailureAnalysis();
        break;
      case "MONGODB_BI_AVG_TXN_VAL":
        pipeline = analyticsQueryLibrary.getAverageTransactionValue();
        break;
      case "MONGODB_BI_HOURLY_DIST":
        pipeline = analyticsQueryLibrary.getHourlyTransactionDistribution();
        break;
      case "MONGODB_BI_ACTIVE_24H":
        pipeline = analyticsQueryLibrary.getActiveDevicesLast24h();
        break;
      case "MONGODB_BI_TOP_DEVICES_REV":
        pipeline = analyticsQueryLibrary.getTopDevicesByRevenue(
          limit,
          year,
          month,
        );
        break;
      case "MONGODB_BI_TXN_FREQ":
        pipeline = analyticsQueryLibrary.getDeviceTransactionFrequency();
        break;
      case "MONGODB_BI_MODE_DIST":
        pipeline = analyticsQueryLibrary.getTransactionModeDistribution();
        break;
      case "MONGODB_BI_TYPE_DIST":
        pipeline = analyticsQueryLibrary.getTransactionTypeDistribution();
        break;
      case "MONGODB_BI_LARGEST_TXNS":
        pipeline = analyticsQueryLibrary.getLargestTransactions(
          limit,
          year,
          month,
        );
        break;
      case "MONGODB_BI_DAILY_VOL":
        pipeline = analyticsQueryLibrary.getDailyTransactionVolume(days);
        break;
      case "MONGODB_BI_HIGH_REV_DEV_MONTH":
        pipeline = analyticsQueryLibrary.getHighestRevenueDeviceByMonth(
          year,
          month,
        );
        break;
      case "MONGODB_BI_ARPAD":
        pipeline = analyticsQueryLibrary.getAverageRevenuePerDevice();
        break;
      case "MONGODB_BI_FAILURES":
        pipeline = analyticsQueryLibrary.getDevicesWithHighestFailures(limit);
        break;
      case "MONGODB_BI_HIGH_VALUE":
        pipeline = analyticsQueryLibrary.getHighValueTransactions(
          threshold,
          limit,
        );
        break;
      case "MONGODB_BI_DAY_OF_WEEK":
        pipeline = analyticsQueryLibrary.getRevenueByDayOfWeek();
        break;
      case "MONGODB_BI_SYSTEM_SUMMARY":
        collectionName = "systemSummaryInfo";
        pipeline = analyticsQueryLibrary.getSystemSummary();
        break;
    }

    if (pipeline.length > 0) {
      return await db.collection(collectionName).aggregate(pipeline).toArray();
    }
  }

  if (
    intent === "MONGODB_TXN" ||
    intent === "MONGODB_STATS" ||
    intent === "MONGODB"
  ) {
    console.log(`[Hybrid Broker] MongoDB primary intent detected: ${intent}`);
    const filterContext =
      intent === "MONGODB_TXN"
        ? { _targetCollection: "transactionActionHistoryInfo" }
        : intent === "MONGODB_STATS"
          ? { _targetCollection: "deviceStatHistoryInfo" }
          : {};
    return await executeDirectMongoQuery(question, filterContext);
  }

  console.log(
    "[Hybrid Broker] HYBRID Bridge detected: Postgres Metadata -> MongoDB Transactions.",
  );

  const startTime = Date.now();

  // STEP 2: Query Postgres to get IDs/Context
  const contextPrompt = `
  Find the "deviceId" and "merchantBusinessName" for any merchants mentioned in the ORIGINAL question. 
  
  ORIGINAL QUESTION: "${question}"
  
  STRICT ARCHITECTURAL RULES:
  1. Use ONLY "merchantInfo", "merchantRelationInfo", and "deviceRelationInfo".
  2. JOIN Pattern: "merchantInfo"."merchantId" -> "merchantRelationInfo"."merchantId" -> "deviceRelationInfo"."relationId".
  3. Return "deviceId" (BIGINT) and "merchantBusinessName" (VARCHAR).
  4. Return ONLY a valid SELECT query.
  `;

  const sqlAgent = require("./sqlAgent");
  const metadataSql = await sqlAgent.generateSQLFromPrompt(
    contextPrompt,
    question,
    requestId,
  );

  const pgStart = Date.now();
  const metadataResults = await executeDynamicQuery(metadataSql);
  const pgDuration = Date.now() - pgStart;

  if (!metadataResults || metadataResults.length === 0) {
    console.log(
      "[Hybrid Broker] No matching metadata found in Postgres. Falling back to direct Mongo search.",
    );
    return await executeDirectMongoQuery(question);
  }

  // Extract IDs to filter Mongo
  const deviceIds = metadataResults.map((r) => r.deviceId).filter((id) => id);
  console.log(
    `[Hybrid Broker] Retrieved ${deviceIds.length} IDs from Postgres: ${deviceIds.join(", ")}`,
  );

  // STEP 3: Query MongoDB with retrieved IDs
  const mongoStart = Date.now();
  const mongoResults = await executeDirectMongoQuery(question, {
    deviceId: { $in: deviceIds },
  });
  const mongoDuration = Date.now() - mongoStart;

  // STEP 4: ENRICHMENT - Join Postgres Names with Mongo Data
  const nameMap = {};
  metadataResults.forEach((r) => {
    const dId = r.deviceId || r.id;
    if (dId)
      nameMap[String(dId)] =
        r.merchantBusinessName || r.merchantName || r.merchantId;
  });

  const totalDuration = Date.now() - startTime;
  console.log(
    `[Hybrid Broker] Timing: Total=${totalDuration}ms | PG=${pgDuration}ms | Mongo=${mongoDuration}ms`,
  );

  return mongoResults.map((r) => ({
    ...r,
    merchantName: nameMap[String(r.deviceId)] || "Unknown Merchant",
    _profiling: { totalDuration, pgDuration, mongoDuration },
  }));
}

async function executeDirectMongoQuery(question, filterContext = {}) {
  const { collection: collectionName, query } = await generateMQLFromPrompt(
    question,
    filterContext,
  );
  const db = await connectMongo();

  if (!collectionName)
    throw new Error("Mongo Agent failed to select a collection.");

  const collection = db.collection(collectionName);

  if (Array.isArray(query)) {
    return await collection.aggregate(query).toArray();
  } else {
    // If it's a find query, we merge the filterContext into it if it's not already there
    // Remove internal flags before passing to Mongo
    let finalQuery = { ...query };
    if (filterContext && Object.keys(filterContext).length > 0) {
      const cleanFilter = { ...filterContext };
      delete cleanFilter._targetCollection;
      finalQuery = { ...finalQuery, ...cleanFilter };
    }
    return await collection.find(finalQuery).limit(50).toArray();
  }
}

module.exports = { orchestrateHybridQuery };
