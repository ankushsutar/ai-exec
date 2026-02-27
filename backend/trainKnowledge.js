const {
  extractAllTableNames,
  getAICuratedTables,
} = require("./src/services/schemaPruner");
const { extractDatabaseSchema } = require("./src/services/dbService");
const {
  generateSchemaSummary,
  loadCache,
  saveCache,
} = require("./src/services/trainingService");
const { generateEmbedding } = require("./src/services/ollamaService");
const {
  addTableEmbedding,
  saveStore,
  clearStore,
} = require("./src/services/vectorStore");
const { initializeKnowledgeBase } = require("./src/services/knowledgeBase");

async function train() {
  console.log("\n[CLI Trainer] Starting full knowledge pre-computation...");
  console.time("TotalTrainingTime");

  try {
    clearStore();
    const knowledgeCache = loadCache();

    // 1. SQL Training
    console.log("\n[1/2] Discovering PostgreSQL Tables...");
    const rawTables = await extractAllTableNames();
    const aiCuratedTables = await getAICuratedTables(rawTables);
    const schemaString = await extractDatabaseSchema(aiCuratedTables);
    const tableBlocks = schemaString
      .split("\n\n")
      .filter((b) => b.trim() !== "");

    for (const block of tableBlocks) {
      const trimmedBlock = block.trim();
      const tableName = trimmedBlock
        .split("\n")[0]
        .replace("TABLE: ", "")
        .replace(/^"|"$/g, "")
        .trim();
      process.stdout.write(`  > Processing table: ${tableName}... `);
      const summary = await generateSchemaSummary(
        tableName,
        trimmedBlock,
        "postgres",
        knowledgeCache,
      );
      const embedding = await generateEmbedding(
        `${trimmedBlock}\nPURPOSE: ${summary}`,
      );
      addTableEmbedding(tableName, trimmedBlock, embedding, summary);
      process.stdout.write("Done.\n");
    }

    // 2. Mongo Training
    console.log("\n[2/2] Discovering MongoDB Collections...");
    const {
      listCollections,
      extractMongoSchema,
    } = require("./src/services/mongoService");
    try {
      const mongoCollections = await listCollections();
      const mongoSchemaString = await extractMongoSchema(mongoCollections);
      const mongoBlocks = mongoSchemaString
        .split("\n\n")
        .filter((b) => b.trim() !== "");

      for (const block of mongoBlocks) {
        const trimmedBlock = block.trim();
        const collectionName = trimmedBlock
          .split("\n")[0]
          .replace('COLLECTION: "', "")
          .replace('"', "")
          .trim();
        process.stdout.write(
          `  > Processing collection: ${collectionName}... `,
        );
        const summary = await generateSchemaSummary(
          collectionName,
          trimmedBlock,
          "mongodb",
          knowledgeCache,
        );
        const embedding = await generateEmbedding(
          `${trimmedBlock}\nPURPOSE: ${summary}`,
        );
        addTableEmbedding(
          collectionName,
          trimmedBlock,
          embedding,
          summary,
          "mongodb",
        );
        process.stdout.write("Done.\n");
      }
    } catch (e) {
      console.warn("  ! MongoDB skipped.");
    }

    saveCache(knowledgeCache);
    saveStore();

    console.log("\n[CLI Trainer] Persisted pre-computed artifacts to /config/");
    console.timeEnd("TotalTrainingTime");
  } catch (error) {
    console.error("\n[CLI Trainer] Critical Error:", error.message);
  }
}

train();
