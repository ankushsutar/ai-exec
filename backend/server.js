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

// Start Server
app.listen(config.port, async () => {
  console.log(`Server is running on port ${config.port}`);

  try {
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
          process.stdout.write(`[Server] Embedding table: ${tableName}... `);
          const embedding = await generateEmbedding(trimmedBlock);
          addTableEmbedding(tableName, trimmedBlock, embedding);
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

    console.log(
      "[Server] AI Platform Boot Sequence Complete. Ready for queries.",
    );
  } catch (err) {
    console.error("Failed to initialize dynamic schema on boot.", err);
  }
});
