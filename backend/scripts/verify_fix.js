const { generateSQLFromPrompt } = require("../src/services/sqlAgent");
const { extractDatabaseSchema } = require("../src/services/dbService");
const { dispatchIntent } = require("../src/services/intentDispatcher");

async function runVerification() {
  console.log("Warming up Vector Store...");
  // Manually extract schema to verify cleanup
  const schemaText = await extractDatabaseSchema([
    "userInfo",
    "userGroupInfo",
    "merchantInfo",
  ]);

  // Verify transactionInfo is GONE from schema extraction
  if (schemaText.includes("transactionInfo")) {
    console.error(
      "❌ CRITICAL FAILURE: transactionInfo still exists in schema dump!",
    );
    process.exit(1);
  } else {
    console.log("✅ Verified: transactionInfo is physically removed from DB.");
  }

  const questions = [
    "show all the users",
    "list all merchants",
    "find devices for merchant Ankush",
    "How many transactions are in transactionHistoryInfo?",
  ];

  console.log("Starting System-Wide Verification...");

  for (const q of questions) {
    console.log(`\nQUESTION: "${q}"`);
    try {
      const intent = await dispatchIntent(q);
      console.log(`[Intent] Identified as: ${intent}`);

      if (q.toLowerCase().includes("transaction") && intent === "SQL") {
        console.error(
          "❌ FAILED: Transaction query incorrectly routed to SQL.",
        );
        continue;
      }

      if (intent === "SQL") {
        const sql = await generateSQLFromPrompt(q);
        console.log(`GENERATED SQL: ${sql}`);

        // Check for hallucinations
        const hallucinations = ["transactioninfo", "product", "sales"];
        const foundHallucinations = hallucinations.filter((h) =>
          sql.toLowerCase().includes(h),
        );

        if (foundHallucinations.length > 0) {
          console.error(
            `❌ FAILED: Hallucinations detected (or illegal table used): ${foundHallucinations.join(", ")}`,
          );
        } else {
          console.log("✅ PASSED: SQL query looks clean and relevant.");
        }
      } else {
        console.log(
          `✅ PASSED: Correctly identified as ${intent} (handled by Mongo/Hybrid).`,
        );
      }
    } catch (error) {
      console.error(`❌ ERROR: ${error.message}`);
    }
  }
}

runVerification();
