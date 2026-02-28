const { generateSQLFromPrompt } = require("./sqlAgent");
const { executeDynamicQuery } = require("./dbService");
const { connect: connectMongo } = require("./mongoService");
const { generateMQLFromPrompt } = require("./mongoAgent");
const { dispatchIntent } = require("./intentDispatcher");

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

  if (intent === "MONGODB") {
    console.log("[Hybrid Broker] MongoDB primary intent detected.");
    return await executeDirectMongoQuery(question);
  }

  console.log(
    "[Hybrid Broker] HYBRID Bridge detected: Postgres Metadata -> MongoDB Transactions.",
  );

  const startTime = Date.now();

  // STEP 2: Query Postgres to get IDs/Context
  const contextPrompt = `
  Find the "id" and "deviceId" for any merchants or users mentioned in the ORIGINAL question. 
  
  ORIGINAL QUESTION: "${question}"
  
  REQUIRED OUTPUT:
  - You must use JOINs between "merchantInfo", "merchantRelationInfo", and "deviceRelationInfo".
  - Return the merchantBusinessName and corresponding deviceId.
  - Return ONLY a valid SELECT query.
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
  const deviceIds = metadataResults
    .map((r) => r.deviceId || r.id)
    .filter((id) => id);
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
    let finalQuery = query;
    if (filterContext && Object.keys(filterContext).length > 0) {
      finalQuery = { ...query, ...filterContext };
    }
    return await collection.find(finalQuery).limit(50).toArray();
  }
}

module.exports = { orchestrateHybridQuery };
