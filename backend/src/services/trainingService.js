const axios = require("axios");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const config = require("../config/env");

const CACHE_FILE = path.join(__dirname, "../config/knowledge_cache.json");

/**
 * Generates a unique fingerprint for a schema string.
 */
function getSchemaFingerprint(schemaText) {
  return crypto.createHash("sha256").update(schemaText).digest("hex");
}

/**
 * Loads the existing knowledge cache.
 */
function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
    }
  } catch (e) {
    console.warn("[Training] Failed to load knowledge cache:", e.message);
  }
  return {};
}

/**
 * Saves the knowledge cache.
 */
function saveCache(cache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (e) {
    console.error("[Training] Failed to save knowledge cache:", e.message);
  }
}

/**
 * Service to "Train" the LLM on the database schema by generating semantic summaries.
 * Uses fingerprinting to avoid redundant calls.
 */
async function generateSchemaSummary(
  schemaName,
  schemaText,
  dbType = "postgres",
  cache = {},
) {
  const currentFingerprint = getSchemaFingerprint(schemaText);
  const cachedEntity = cache[schemaName];

  if (cachedEntity && cachedEntity.fingerprint === currentFingerprint) {
    console.log(
      `[Training] Cache hit for ${dbType} "${schemaName}". Skipping LLM training.`,
    );
    return cachedEntity.summary;
  }

  console.log(
    `[Training] ${cachedEntity ? "Change detected" : "New entity"} in ${dbType} "${schemaName}". Generating semantic summary...`,
  );

  const prompt = `
    You are a Data Architect. Briefly explain the BUSINESS PURPOSE of the following ${dbType} ${dbType === "postgres" ? "table" : "collection"} based on its fields.
    
    SCHEMA:
    ${schemaText}

    TASK:
    - Return exactly ONE sentence describing what this store is for (e.g. "Stores user profile information and authentication states").
    - DO NOT include technical details like field names.
    - DO NOT say "This table is for". Just state the purpose.
  `;

  try {
    const response = await axios.post(
      config.ollamaUrl,
      {
        model: "qwen2.5:0.5b",
        prompt: prompt,
        stream: false,
      },
      { timeout: 30000 },
    );

    const summary = response.data.response.trim().replace(/^"|"$/g, "");

    // Update cache object in memory (caller will save it)
    cache[schemaName] = {
      summary,
      fingerprint: currentFingerprint,
      dbType,
      updatedAt: new Date().toISOString(),
    };

    console.log(`[Training] Summary for "${schemaName}": ${summary}`);
    return summary;
  } catch (error) {
    console.warn(
      `[Training] Failed to summarize ${schemaName}:`,
      error.message,
    );
    return ""; // Fallback to no summary
  }
}

/**
 * Orchestrates the "Deep Training" sequence for a set of tables.
 */
async function runDeepTraining(entities, dbType = "postgres") {
  const cache = loadCache();
  const trainedEntities = [];
  let cacheModified = false;

  for (const entity of entities) {
    const oldSummary = cache[entity.name]?.summary;
    const summary = await generateSchemaSummary(
      entity.name,
      entity.schema,
      dbType,
      cache,
    );

    if (summary !== oldSummary) cacheModified = true;

    trainedEntities.push({
      ...entity,
      summary,
    });
  }

  if (cacheModified) {
    saveCache(cache);
  }

  return trainedEntities;
}

module.exports = {
  runDeepTraining,
  generateSchemaSummary,
  loadCache,
  saveCache,
};
