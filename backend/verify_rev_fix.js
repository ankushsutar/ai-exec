const { connect: connectMongo } = require("./src/services/mongoService");
const { orchestrateHybridQuery } = require("./src/services/hybridBroker");

async function verifyRevenueTrend() {
  console.log("--- Verifying 7-Day Revenue Trend Fix ---");

  try {
    const db = await connectMongo();

    // Test the specific intent that were failing
    console.log("\nTesting Intent: MONGODB_BI_REV_7D");
    const question = "Show revenue trend for the last 7 days";

    // We can't easily call orchestrateHybridQuery here because it mock IDs and consoles
    // but we can simulate the logic or use a helper

    const latestTxn = await db
      .collection("transactionActionHistoryInfo")
      .find({ actionStatus: 1 })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();

    const referenceDate = latestTxn.length > 0 ? latestTxn[0].createdAt : null;
    console.log("Detected Reference Date:", referenceDate);

    const analyticsQueryLibrary = require("./src/services/analyticsQueryLibrary");
    const pipeline = analyticsQueryLibrary.getRevenueLast7Days(referenceDate);

    console.log(
      "Pipeline with reference date:",
      JSON.stringify(pipeline, null, 2),
    );

    const results = await db
      .collection("transactionActionHistoryInfo")
      .aggregate(pipeline)
      .toArray();
    console.log("Results:", JSON.stringify(results, null, 2));

    if (results.length > 0) {
      console.log("SUCCESS: Data fetched successfully!");
    } else {
      console.warn("FAILED: Still no data. Check logic.");
    }
  } catch (e) {
    console.error("ERROR:", e);
  }
  process.exit(0);
}

verifyRevenueTrend();
