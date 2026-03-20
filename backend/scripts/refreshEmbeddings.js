const { extractDatabaseSchema } = require("../src/services/data/dbService");
const {
  ALLOWED_POSTGRES_TABLES,
  ALLOWED_MONGO_COLLECTIONS,
} = require("../src/config/allowedSchema");
const { generateEmbedding } = require("../src/services/ai/ollamaService");
const { addTableEmbedding, saveStore } = require("../src/services/data/vectorStore");
const {
  generateSchemaSummary,
  loadCache,
  saveCache,
} = require("../src/services/knowledge/trainingService");
const { extractMongoSchema } = require("../src/services/data/mongoService");

async function refresh() {
  console.log("====================================================");
  console.log("   AI-EXEC FOCUSED EMBEDDING REFRESH                ");
  console.log("====================================================\n");

  try {
    const knowledgeCache = loadCache();
    
    // 1. Postgres (Should be empty per new config)
    if (ALLOWED_POSTGRES_TABLES.length > 0) {
      console.log(`[Refresh] Processing ${ALLOWED_POSTGRES_TABLES.length} Postgres tables...`);
      const schemaString = await extractDatabaseSchema(ALLOWED_POSTGRES_TABLES);
      const tableBlocks = schemaString.split("\n\n").filter((b) => b.trim() !== "");

      for (const block of tableBlocks) {
        const trimmedBlock = block.trim();
        if (trimmedBlock.startsWith("TABLE: ")) {
          const tableName = trimmedBlock
            .split("\n")[0]
            .replace("TABLE: ", "")
            .replace(/^"|"$/g, "")
            .trim();
          console.log(`[Refresh] Summarizing SQL: ${tableName}...`);
          const summary = await generateSchemaSummary(tableName, trimmedBlock, "postgres", knowledgeCache);
          const embedding = await generateEmbedding(`${trimmedBlock}\nPURPOSE: ${summary}`);
          addTableEmbedding(tableName, trimmedBlock, embedding, summary);
        }
      }
    } else {
      console.log("[Refresh] No Postgres tables in whitelist. Skipping.");
    }

    // 2. MongoDB
    if (ALLOWED_MONGO_COLLECTIONS.length > 0) {
      console.log(`[Refresh] Processing ${ALLOWED_MONGO_COLLECTIONS.length} Mongo collections...`);
      const mongoSchemaString = await extractMongoSchema(ALLOWED_MONGO_COLLECTIONS);
      const mongoBlocks = mongoSchemaString.split("\n\n").filter((b) => b.trim() !== "");

      for (const block of mongoBlocks) {
        const trimmedBlock = block.trim();
        if (trimmedBlock.startsWith('COLLECTION: "')) {
          const collectionName = trimmedBlock
            .split("\n")[0]
            .replace('COLLECTION: "', "")
            .replace('"', "")
            .trim();
          console.log(`[Refresh] Summarizing Mongo: ${collectionName}...`);
          const summary = await generateSchemaSummary(collectionName, trimmedBlock, "mongodb", knowledgeCache);
          const embedding = await generateEmbedding(`${trimmedBlock}\nPURPOSE: ${summary}`);
          addTableEmbedding(collectionName, trimmedBlock, embedding, summary, "mongodb");
        }
      }
    } else {
      console.log("[Refresh] No Mongo collections in whitelist. Skipping.");
    }

    console.log("\n[Refresh] Saving results...");
    saveCache(knowledgeCache);
    saveStore();

    console.log("\n====================================================");
    console.log("   REFRESH COMPLETE                                 ");
    console.log("====================================================");
    process.exit(0);
  } catch (err) {
    console.error("\n[Refresh] CRITICAL ERROR:", err.message);
    process.exit(1);
  }
}

refresh();
