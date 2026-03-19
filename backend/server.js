const express = require("express");
const cors = require("cors");
const config = require("./src/config/env");
const apiLimiter = require("./src/middleware/rateLimiter");
const errorHandler = require("./src/middleware/errorHandler");
const askRoutes = require("./src/routes/askRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

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

const { extractDatabaseSchema } = require("./src/services/data/dbService");
const {
  ALLOWED_POSTGRES_TABLES,
  ALLOWED_MONGO_COLLECTIONS,
} = require("./src/config/allowedSchema");
const { generateEmbedding } = require("./src/services/ai/ollamaService");
const { addTableEmbedding } = require("./src/services/data/vectorStore");
const {
  initializeKnowledgeBase,
} = require("./src/services/knowledge/knowledgeBase");
const {
  generateSchemaSummary,
  loadCache,
  saveCache,
} = require("./src/services/knowledge/trainingService");
// const { initializeIntentRAG } = require("./src/services/ai/intentRAG");

// Start Server
app.listen(config.port, async () => {
  console.log(`Server is running on port ${config.port}`);

  try {
    const { loadStore, saveStore } = require("./src/services/data/vectorStore");
    const isStoreLoaded = loadStore();

    if (!isStoreLoaded) {
      console.log(
        "[Server] Pre-computed embeddings not found. Starting full training sequence...",
      );

      const knowledgeCache = loadCache();
      console.log(
        `[Server] Using schema whitelist: ${ALLOWED_POSTGRES_TABLES.length} Postgres tables, ${ALLOWED_MONGO_COLLECTIONS.length} Mongo collections.`,
      );
      const schemaString = await extractDatabaseSchema(ALLOWED_POSTGRES_TABLES);

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
      } = require("./src/services/data/mongoService");
      try {
        // Use whitelist instead of discovering all collections
        const mongoSchemaString = await extractMongoSchema(
          ALLOWED_MONGO_COLLECTIONS,
        );
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
    // await initializeIntentRAG();
    console.log(
      "[Server] AI Platform Boot Sequence Complete. Ready for queries.",
    );
  } catch (err) {
    console.error("Failed to initialize dynamic schema on boot.", err);
  }
});
