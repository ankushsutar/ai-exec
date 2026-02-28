const { dispatchIntent } = require("../src/services/intentDispatcher");
const { generateEmbedding } = require("../src/services/ollamaService");
const {
  getTopSchemasString,
  loadStore,
} = require("../src/services/vectorStore");

async function verify() {
  // Ensure store is loaded from disk
  loadStore();
  const testCases = [
    "top 5 merchants by revenue",
    "show all transactions for merchant Ankush",
    "list all devices",
    "total sales in the last 7 days",
    "which merchants have no active devices?",
  ];

  console.log("=== Text-to-Query Verification ===\n");

  for (const q of testCases) {
    console.log(`Question: "${q}"`);
    try {
      const intent = await dispatchIntent(q);
      console.log(`- Detected Intent: ${intent}`);

      const embedding = await generateEmbedding(q);
      const schema = getTopSchemasString(
        embedding,
        q,
        3,
        intent === "SQL" ? "postgres" : intent === "MONGODB" ? "mongodb" : null,
      );

      console.log(
        `- Schema Matches: ${schema ? "YES (Found relevant tables)" : "NO (Retrieval failed)"}`,
      );
      if (schema) {
        const lines = schema
          .split("\n")
          .filter(
            (l) =>
              l.startsWith("TABLE:") ||
              l.startsWith("COLLECTION:") ||
              l.startsWith("SOURCE:"),
          );
        console.log(`  Retrieval Context: ${lines.join(", ")}`);
      }
    } catch (e) {
      console.error(`- Error verifying "${q}":`, e.message);
    }
    console.log("");
  }
}

// Mocking required for standalone run if env not fully loaded
process.env.OLLAMA_URL =
  process.env.OLLAMA_URL || "http://localhost:11434/api/generate";

verify().then(() => console.log("Verification complete."));
