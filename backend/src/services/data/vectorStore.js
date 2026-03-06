const fs = require("fs");
const path = require("path");
const STORE_FILE = path.join(
  __dirname,
  "../../storage/knowledge_embeddings.json",
);

let memoryStore = [];
const embeddingCache = new Map();

/**
 * Persists the current memory store to disk.
 */
function saveStore() {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(memoryStore, null, 2));
    console.log(
      `[Vector Store] Persisted ${memoryStore.length} embeddings to disk.`,
    );
  } catch (e) {
    console.error("[Vector Store] Failed to save store:", e.message);
  }
}

/**
 * Loads the memory store from disk.
 */
function loadStore() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      memoryStore = JSON.parse(fs.readFileSync(STORE_FILE, "utf8"));
      console.log(
        `[Vector Store] Loaded ${memoryStore.length} embeddings from disk.`,
      );
      return true;
    }
  } catch (e) {
    console.warn("[Vector Store] Failed to load store:", e.message);
  }
  return false;
}

/**
 * Gets a cached embedding if available.
 */
function getCachedEmbedding(text) {
  return embeddingCache.get(text);
}

/**
 * Caches an embedding.
 */
function setCachedEmbedding(text, embedding) {
  if (embeddingCache.size > 1000) {
    // Basic eviction: clear if too large
    embeddingCache.clear();
  }
  embeddingCache.set(text, embedding);
}

/**
 * Saves a table's schema, mathematical embedding, and AI summary to memory.
 */
function addTableEmbedding(
  tableName,
  schemaText,
  embedding,
  summary = "",
  dbType = "postgres",
) {
  if (!embedding || embedding.length === 0) {
    throw new Error("Invalid embedding vector provided.");
  }

  const data = { tableName, schemaText, embedding, summary, dbType };

  // Check if table already exists, update if so
  const existingIndex = memoryStore.findIndex((t) => t.tableName === tableName);
  if (existingIndex >= 0) {
    memoryStore[existingIndex] = data;
  } else {
    memoryStore.push(data);
  }
  console.log(
    `[Vector Store] Table "${tableName}" saved ${summary ? "(with AI summary)" : ""}. Memory store size: ${memoryStore.length}`,
  );
}

/**
 * Helper formula: Calculates the Cosine Similarity (angle) between two vectors.
 * 1.0 means perfectly identical directions (identical semantic meaning).
 * -1.0 means exactly opposite.
 */
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Searches the memory store for the top K tables using Hybrid Search (Vector + Keyword)
 */
function searchSimilarTables(
  questionEmbedding,
  questionText = "",
  limit = 5,
  dbType = null,
) {
  if (memoryStore.length === 0) return [];

  const lowerQuestion = questionText.toLowerCase();

  // Filter by dbType if provided
  const targetStore = dbType
    ? memoryStore.filter((item) => item.dbType === dbType)
    : memoryStore;

  if (targetStore.length === 0) return [];

  // Calculate similarity score between the question and every table in the filtered store
  const scoredTables = targetStore.map((storeObj) => {
    let score = cosineSimilarity(questionEmbedding, storeObj.embedding);

    // KEYWORD BOOST: Split camelCase table names into individual keywords
    // (e.g. "userInfo" -> ["user", "info"])
    const tableName = storeObj.tableName;
    const keywords = tableName
      .replace(/([A-Z])/g, " $1")
      .toLowerCase()
      .split(" ");

    let keywordMatch = false;
    for (const kw of keywords) {
      if (kw.length < 3) continue; // Skip short words like "id"

      // Check if keyword or its singular form is in the question
      const singularKw = kw.endsWith("s") ? kw.slice(0, -1) : kw;
      if (
        lowerQuestion.includes(kw) ||
        (singularKw.length > 3 && lowerQuestion.includes(singularKw))
      ) {
        keywordMatch = true;
        break;
      }
    }

    if (keywordMatch || lowerQuestion.includes(tableName.toLowerCase())) {
      score += 0.4; // Reduced boost to prevent noise from overpowering semantic similarity
    }

    return {
      tableName: storeObj.tableName,
      schemaText: storeObj.schemaText,
      summary: storeObj.summary,
      dbType: storeObj.dbType, // Added dbType here
      score: score,
    };
  });

  // Sort descending by score (highest similarity first)
  scoredTables.sort((a, b) => b.score - a.score);

  // Return the top K closest matches
  return scoredTables.slice(0, limit);
}

function getHighProbabilityTables(questionText) {
  const lowerQ = questionText.toLowerCase();
  const foundationalTables = [];

  // MERCHANT ENTITY TRIAD (SQL)
  if (
    lowerQ.includes("merchant") ||
    lowerQ.includes("business") ||
    lowerQ.includes("vendor")
  ) {
    foundationalTables.push(
      "merchantInfo",
      "merchantRelationInfo",
      "deviceRelationInfo",
    );
  }

  // TRANSACTION & REVENUE ENTITY (Mongo + SQL Bridge)
  if (
    lowerQ.includes("transaction") ||
    lowerQ.includes("revenue") ||
    lowerQ.includes("volume") ||
    lowerQ.includes("sale") ||
    lowerQ.includes("payment") ||
    lowerQ.includes("amount") ||
    lowerQ.includes("trend")
  ) {
    // GROUNDING: Force include the core transaction collection in Mongo
    // AND the linking table in SQL
    foundationalTables.push(
      "transactionActionHistoryInfo",
      "deviceRelationInfo",
      "merchantInfo",
    );
  }

  // USER ENTITY
  if (
    lowerQ.includes("user") ||
    lowerQ.includes("owner") ||
    lowerQ.includes("admin")
  ) {
    foundationalTables.push("userInfo", "userGroupInfo");
  }

  // DEVICE ENTITY
  if (
    lowerQ.includes("device") ||
    lowerQ.includes("pauay") ||
    lowerQ.includes("terminal") ||
    lowerQ.includes("iccid")
  ) {
    foundationalTables.push(
      "deviceInfo",
      "deviceRelationInfo",
      "deviceBriefInfo",
    );
  }

  return [...new Set(foundationalTables)];
}

/**
 * Returns the raw string containing the most relevant schemas.
 * Combines High-Probability (Hard) Grounding with Vector (Soft) Grounding.
 */
function getTopSchemasString(
  questionEmbedding,
  questionText = "",
  limit = 5,
  dbType = null,
) {
  // 1. Get Hard-Grounded Tables based on Keywords
  const hardGroundedNames = getHighProbabilityTables(questionText);

  // 2. Get Soft-Grounded Tables based on Vector Similarity
  const topMatches = searchSimilarTables(
    questionEmbedding,
    questionText,
    limit,
    dbType,
  );

  // 3. Logic to combine and de-duplicate
  const finalMatches = [];
  const seenTableNames = new Set();

  // Prioritize Hard Grounding if dbType matches
  for (const hardName of hardGroundedNames) {
    const tableObj = memoryStore.find(
      (t) => t.tableName === hardName && (!dbType || t.dbType === dbType),
    );
    if (tableObj && !seenTableNames.has(hardName)) {
      finalMatches.push({ ...tableObj, score: 1.0, isHardGrounded: true });
      seenTableNames.add(hardName);
    }
  }

  // Backfill with Vector Matches
  for (const match of topMatches) {
    if (!seenTableNames.has(match.tableName)) {
      finalMatches.push(match);
      seenTableNames.add(match.tableName);
    }
  }

  let combinedSchema = "";
  for (const match of finalMatches.slice(0, 6)) {
    // Reduced from limit+2 to fixed small number
    combinedSchema += `SOURCE: ${match.dbType}${match.isHardGrounded ? " (Foundation Table)" : ""}\n`;
    if (match.summary) {
      combinedSchema += `PURPOSE: ${match.summary}\n`;
    }

    // OPTIMIZATION: If the schema is too long, we only send the first 15 columns to prevent timeout
    let schemaLines = match.schemaText.split("\n");
    if (schemaLines.length > 20) {
      combinedSchema +=
        schemaLines.slice(0, 15).join("\n") +
        "\n... (additional columns omitted for brevity)\n\n";
    } else {
      combinedSchema += match.schemaText + "\n\n";
    }
  }

  const matchedNames = finalMatches
    .map((m) => `${m.tableName}${m.isHardGrounded ? "*" : ""}`)
    .slice(0, 6)
    .join(", ");
  console.log(
    `[Vector Store] Grounded schema context (Optimized): ${matchedNames}`,
  );

  return combinedSchema.trim();
}

/**
 * Wipes the store (useful for server restarts/schema reloads)
 */
function clearStore() {
  memoryStore = [];
}

module.exports = {
  addTableEmbedding,
  searchSimilarTables,
  getTopSchemasString,
  clearStore,
  cosineSimilarity,
  getCachedEmbedding,
  setCachedEmbedding,
  saveStore,
  loadStore,
};
