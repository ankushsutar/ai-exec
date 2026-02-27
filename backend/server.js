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
    // 0. Load Knowledge Cache
    const knowledgeCache = loadCache();

    // 1. Get raw list of all tables
    const rawTables = await extractAllTableNames();

    // 2. Ask AI to filter out system noise and return a whitelist
    const aiCuratedTables = await getAICuratedTables(rawTables);

    // 3. Introspect DB schema dynamically ONLY for those curated tables
    const schemaString = await extractDatabaseSchema(aiCuratedTables);

    // 4. Populate In-Memory Vector Store for RAG
    console.log("[Server] Populating In-Memory Vector Store...");
    const tableBlocks = schemaString
      .split("\n\n")
      .filter((block) => block.trim() !== "");
    console.log(`[Server] Found ${tableBlocks.length} table blocks to embed.`);

    for (const block of tableBlocks) {
      const trimmedBlock = block.trim();
      if (trimmedBlock.startsWith("TABLE: ")) {
        const rawTableName = trimmedBlock
          .split("\n")[0]
          .replace("TABLE: ", "")
          .trim();
        const tableName = rawTableName.replace(/^"|"$/g, ""); // Strip leading/trailing quotes for store key
        try {
          process.stdout.write(
            `[Server] Training & Embedding table: ${tableName}... `,
          );
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
        } catch (embedErr) {
          process.stdout.write("FAILED.\n");
          console.error(
            `[Server] Error embedding ${tableName}:`,
            embedErr.message,
          );
        }
      } else {
        console.log(
          `[Server] Skipping block: Does not start with TABLE: "${trimmedBlock.substring(0, 20)}..."`,
        );
      }
    }

    // Save cache after postgres training
    saveCache(knowledgeCache);

    // 5. Populate MongoDB Collections for RAG
    const {
      listCollections,
      extractMongoSchema,
    } = require("./src/services/mongoService");
    try {
      console.log("[Server] Discovering MongoDB Collections...");
      const mongoCollections = await listCollections();
      const mongoSchemaString = await extractMongoSchema(mongoCollections);

      const mongoBlocks = mongoSchemaString
        .split("\n\n")
        .filter((block) => block.trim() !== "");

      console.log(
        `[Server] Found ${mongoBlocks.length} MongoDB collections to embed.`,
      );

      for (const block of mongoBlocks) {
        const trimmedBlock = block.trim();
        if (trimmedBlock.startsWith('COLLECTION: "')) {
          const collectionName = trimmedBlock
            .split("\n")[0]
            .replace('COLLECTION: "', "")
            .replace('"', "")
            .trim();

          try {
            process.stdout.write(
              `[Server] Training & Embedding collection: ${collectionName}... `,
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
          } catch (embedErr) {
            process.stdout.write("FAILED.\n");
            console.error(
              `[Server] Error embedding ${collectionName}:`,
              embedErr.message,
            );
          }
        }
      }

      // Save cache after mongo training
      saveCache(knowledgeCache);
    } catch (mongoErr) {
      console.warn(
        "[Server] MongoDB discovery failed or no collections found. Skipping MongoDB indexing.",
      );
    }

    // 6. Initialize Golden Queries Knowledge Base
    await initializeKnowledgeBase();

    console.log(
      "[Server] AI Platform Boot Sequence Complete. Ready for queries.",
    );
  } catch (err) {
    console.error("Failed to initialize dynamic schema on boot.", err);
  }
});
