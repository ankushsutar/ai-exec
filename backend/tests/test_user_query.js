const { orchestrateHybridQuery } = require("../src/services/ai/hybridBroker");

async function testUserQuery() {
  console.log("--- Testing User Query Routing ---");
  const question = "show all users";

  try {
    const results = await orchestrateHybridQuery(question, "test-user-query");
    console.log("Total results found:", results.length);

    if (
      results &&
      results.length > 0 &&
      (results[0].id || results[0].firstName)
    ) {
      console.log(
        "✅ Success: 'show all users' routed to SQL and returned valid results.",
      );
      process.exit(0);
    } else {
      console.error("❌ Failure: Expected user data but got:", results);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error during test:", error);
    process.exit(1);
  }
}

testUserQuery();
