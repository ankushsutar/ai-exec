const { generateSQLFromPrompt } = require("./src/services/sqlAgent");
const { addTableEmbedding } = require("./src/services/vectorStore");
const { extractDatabaseSchema } = require("./src/services/dbService");

async function runVerification() {
  console.log("Warming up Vector Store...");
  // Manually add the relevant table to the vector store to simulate RAG success
  const schemaText = await extractDatabaseSchema([
    "transactionInfo",
    "userInfo",
    "userGroupInfo",
  ]);
  addTableEmbedding("transactionInfo", schemaText, new Array(1024).fill(0.1)); // Dummy embedding
  addTableEmbedding("userInfo", schemaText, new Array(1024).fill(0.1)); // Dummy embedding
  addTableEmbedding("userGroupInfo", schemaText, new Array(1024).fill(0.1)); // Dummy embedding

  const questions = [
    "Show me total amount of transactions between 2026-01-24 and 2026-01-31",
    "Top 5 transactions by amount in the last week of January 2026",
    "List all transactions for device 1",
    "show all the users",
  ];

  console.log("Starting SQL Agent Verification...");

  for (const q of questions) {
    console.log(`\nQUESTION: "${q}"`);
    try {
      const sql = await generateSQLFromPrompt(q);
      console.log(`GENERATED SQL: ${sql}`);

      // Check for hallucinations
      const hallucinations = ["product", "sales", "rrn = p.rn"];
      const foundHallucinations = hallucinations.filter((h) =>
        sql.toLowerCase().includes(h),
      );

      const isUserQuery = q.toLowerCase().includes("user");
      const usesUserInfo = sql.toLowerCase().includes("userinfo");

      if (foundHallucinations.length > 0) {
        console.error(
          `❌ FAILED: Hallucinations detected: ${foundHallucinations.join(", ")}`,
        );
      } else if (isUserQuery && !usesUserInfo) {
        console.error(`❌ FAILED: User query does not use "userInfo" table.`);
      } else if (
        !isUserQuery &&
        !sql.toUpperCase().includes("transactionInfo".toUpperCase())
      ) {
        console.error(
          `❌ FAILED: Transaction query does not use "transactionInfo" table.`,
        );
      } else {
        console.log(
          "✅ PASSED: No hallucinations detected and correct table used.",
        );
      }
    } catch (error) {
      console.error(`❌ ERROR: ${error.message}`);
    }
  }
}

runVerification();
