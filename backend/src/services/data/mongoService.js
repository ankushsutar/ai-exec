const { MongoClient } = require("mongodb");
const config = require("../../config/env");

let client;
let db;

async function connect() {
  if (db) return db;
  try {
    client = new MongoClient(config.mongoUri);
    await client.connect();
    db = client.db();
    console.log(`[Mongo Service] Connected to MongoDB: ${db.databaseName}`);
    return db;
  } catch (error) {
    console.error("[Mongo Service] Connection error:", error.message);
    throw error;
  }
}

/**
 * Lists all non-system collections in the database.
 */
async function listCollections() {
  const database = await connect();
  const collections = await database.listCollections().toArray();
  return collections
    .map((c) => c.name)
    .filter((name) => !name.startsWith("system."));
}

/**
 * Infers a schema by sampling a few documents from a collection.
 */
async function inferCollectionSchema(collectionName) {
  const database = await connect();
  const collection = database.collection(collectionName);

  // Sample 5 documents to guess types
  const samples = await collection.find({}).limit(5).toArray();
  if (samples.length === 0) return `COLLECTION: "${collectionName}" (Empty)`;

  const schema = {
    collectionName,
    fields: {},
  };

  samples.forEach((doc) => {
    Object.keys(doc).forEach((key) => {
      if (key === "_id") return; // Skip internal ID for cleaner schema
      const val = doc[key];
      const type = typeof val;

      if (!schema.fields[key]) {
        schema.fields[key] = {
          type,
          samples: new Set(),
        };
      }
      if (
        val !== null &&
        val !== undefined &&
        schema.fields[key].samples.size < 3
      ) {
        schema.fields[key].samples.add(String(val));
      }
    });
  });

  let schemaString = `COLLECTION: "${collectionName}"\nFields:\n`;
  Object.entries(schema.fields).forEach(([key, info]) => {
    const samplesArray = Array.from(info.samples);
    schemaString += `  - ${key} (${info.type})${samplesArray.length > 0 ? ` [Samples: ${samplesArray.join(", ")}]` : ""}\n`;
  });

  return schemaString;
}

/**
 * Extracts schema for all provided collections.
 */
async function extractMongoSchema(collectionNames) {
  let combinedSchema = "";
  for (const name of collectionNames) {
    try {
      const schema = await inferCollectionSchema(name);
      combinedSchema += schema + "\n\n";
    } catch (e) {
      console.error(`[Mongo Service] Error introspecting ${name}:`, e.message);
    }
  }
  return combinedSchema.trim();
}

/**
 * ABSOLUTE LOGIC SHIELD: Recursively replaces hallucinated fields (like "date")
 * with the correct schema fields (like "createdAt") for specific collections.
 */
function translateQueryFields(obj, collectionName) {
  if (collectionName !== "transactionActionHistoryInfo") return obj;

  if (obj instanceof Date) return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => translateQueryFields(item, collectionName));
  } else if (obj !== null && typeof obj === "object") {
    const newObj = {};
    for (let [key, value] of Object.entries(obj)) {
      // Direct Field Aliasing (only if not a reserved MongoDB operator key)
      const reservedKeys = ["date", "format", "timezone", "onNull"];
      let newKey = key;
      if (!reservedKeys.includes(key)) {
        if (key === "date") newKey = "createdAt"; // This won't hit now, but for safety
        if (key === "timestamp") newKey = "createdAt";
        if (key === "amount") newKey = "txnAmt";
      }
      
      newObj[newKey] = translateQueryFields(value, collectionName);
    }
    return newObj;
  }
  return obj;
}

/**
 * Executes a MongoDB aggregation or find query.
 */
async function runMongoQuery(collectionName, query) {
  const database = await connect();
  const collection = database.collection(collectionName);
  
  // Apply Logic Shield before execution
  const translatedQuery = translateQueryFields(query, collectionName);
  
  console.log(`[Mongo Service] Executing query on "${collectionName}":`, JSON.stringify(translatedQuery));
  
  if (Array.isArray(translatedQuery)) {
    return await collection.aggregate(translatedQuery).toArray();
  } else {
    return await collection.find(translatedQuery).limit(100).toArray();
  }
}

module.exports = {
  connect,
  listCollections,
  inferCollectionSchema,
  extractMongoSchema,
  runMongoQuery,
};
