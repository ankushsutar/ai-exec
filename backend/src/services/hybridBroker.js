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
    const sql = await generateSQLFromPrompt(question);
    return await executeDynamicQuery(sql);
  }

  if (intent === "MONGODB") {
    console.log("[Hybrid Broker] MongoDB primary intent detected.");
    return await executeDirectMongoQuery(question);
  }

  console.log(
    "[Hybrid Broker] HYBRID Bridge detected: Postgres Metadata -> MongoDB Transactions.",
  );

  // STEP 2: Query Postgres to get IDs/Context
  // We ask the SQL Agent to find the mapping first.
  // IMPORTANT: We must find the link between merchant/user and deviceId.
  const contextPrompt = `Find the "id" and "deviceId" for any merchants or users mentioned here: "${question}". 
  HINT: You likely need to JOIN "merchantInfo", "merchantRelationInfo", and "deviceIdentInfo" to find the "id" that maps to a MongoDB "deviceId". 
  Return a simple table with the result.`;

  const sqlAgent = require("./sqlAgent"); // Lazy load or ensure it's imported
  const metadataSql = await sqlAgent.generateSQLFromPrompt(
    contextPrompt,
    question,
  );
  const metadataResults = await executeDynamicQuery(metadataSql);

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
  const mongoResults = await executeDirectMongoQuery(question, {
    deviceId: { $in: deviceIds },
  });

  // STEP 4: ENRICHMENT - Join Postgres Names with Mongo Data
  const nameMap = {};
  metadataResults.forEach((r) => {
    const dId = r.deviceId || r.id;
    if (dId)
      nameMap[String(dId)] =
        r.merchantBusinessName || r.merchantName || r.merchantId;
  });

  return mongoResults.map((r) => ({
    ...r,
    merchantName: nameMap[String(r.deviceId)] || "Unknown Merchant",
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
