const express = require("express");
const cors = require("cors");
const config = require("./src/config/env");
const apiLimiter = require("./src/middleware/rateLimiter");
const errorHandler = require("./src/middleware/errorHandler");
const askRoutes = require("./src/routes/askRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Apply rate limiting to /ask routes
app.use("/ask", apiLimiter);

// Routes
app.use("/ask", askRoutes);

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Error Handling Middleware
app.use(errorHandler);

const { extractDatabaseSchema } = require("./src/services/dbService");
const {
  extractAllTableNames,
  getAICuratedTables,
} = require("./src/services/schemaPruner");
const { generateEmbedding } = require("./src/services/ollamaService");
const { addTableEmbedding } = require("./src/services/vectorStore");
const { initializeKnowledgeBase } = require("./src/services/knowledgeBase");
const {
  generateSchemaSummary,
  loadCache,
  saveCache,
} = require("./src/services/trainingService");

// Start Server
app.listen(config.port, async () => {
  console.log(`Server is running on port ${config.port}`);

  try {
    const { loadStore, saveStore } = require("./src/services/vectorStore");
    const isStoreLoaded = loadStore();

    if (!isStoreLoaded) {
      console.log(
        "[Server] Pre-computed embeddings not found. Starting full training sequence...",
      );

      const knowledgeCache = loadCache();
      const rawTables = await extractAllTableNames();
      const aiCuratedTables = await getAICuratedTables(rawTables);
      const schemaString = await extractDatabaseSchema(aiCuratedTables);

      console.log("[Server] Populating In-Memory Vector Store...");
      const tableBlocks = schemaString
        .split("\n\n")
        .filter((b) => b.trim() !== "");

      for (const block of tableBlocks) {
        const trimmedBlock = block.trim();
        if (trimmedBlock.startsWith("TABLE: ")) {
          const tableName = trimmedBlock
            .split("\n")[0]
            .replace("TABLE: ", "")
            .replace(/^"|"$/g, "")
            .trim();
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
        }
      }

      // Mongo initialization
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
          if (trimmedBlock.startsWith('COLLECTION: "')) {
            const collectionName = trimmedBlock
              .split("\n")[0]
              .replace('COLLECTION: "', "")
              .replace('"', "")
              .trim();
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
          }
        }
      } catch (mongoErr) {
        console.warn("[Server] MongoDB discovery skipped.");
      }

      saveCache(knowledgeCache);
      saveStore(); // Persist embeddings for next boot
    }

    await initializeKnowledgeBase();
    console.log(
      "[Server] AI Platform Boot Sequence Complete. Ready for queries.",
    );
  } catch (err) {
    console.error("Failed to initialize dynamic schema on boot.", err);
  }
});
