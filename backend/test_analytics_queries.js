/**
 * Analytics Query Library Tester
 * Run from: /home/cwd/dev_ankush/ai/ai-exec/backend
 * Command:   node test_analytics_queries.js
 */

require("dotenv").config();

const analyticsQueryLibrary = require("./src/services/analyticsQueryLibrary");
const { MongoClient } = require("mongodb");

const MONGO_URI =
  process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL;

async function run() {
  if (!MONGO_URI) {
    console.error(
      "❌ No MONGO_URI found in .env. Checked: MONGO_URI, MONGODB_URI, MONGO_URL",
    );
    process.exit(1);
  }

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();
  console.log(`✅ Connected to MongoDB: ${db.databaseName}\n`);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const queries = [
    {
      id: 1,
      name: "getTotalRevenue",
      collection: "transactionActionHistoryInfo",
      pipeline: analyticsQueryLibrary.getTotalRevenue(),
    },
    {
      id: 2,
      name: "getRevenueLast7Days",
      collection: "transactionActionHistoryInfo",
      pipeline: analyticsQueryLibrary.getRevenueLast7Days(),
    },
    {
      id: 3,
      name: "getRevenueTrendPerDay (30d)",
      collection: "transactionActionHistoryInfo",
      pipeline: analyticsQueryLibrary.getRevenueTrendPerDay(30),
    },
    {
      id: 4,
      name: "getRevenuePerDevice",
      collection: "transactionActionHistoryInfo",
      pipeline: analyticsQueryLibrary.getRevenuePerDevice(),
    },
    {
      id: 5,
      name: "getTransactionSuccessRate",
      collection: "transactionActionHistoryInfo",
      pipeline: analyticsQueryLibrary.getTransactionSuccessRate(),
    },
    {
      id: 6,
      name: "getFailureAnalysis",
      collection: "transactionActionHistoryInfo",
      pipeline: analyticsQueryLibrary.getFailureAnalysis(),
    },
    {
      id: 7,
      name: "getAverageTransactionValue",
      collection: "transactionActionHistoryInfo",
      pipeline: analyticsQueryLibrary.getAverageTransactionValue(),
    },
    {
      id: 8,
      name: "getHourlyTransactionDistribution",
      collection: "transactionActionHistoryInfo",
      pipeline: analyticsQueryLibrary.getHourlyTransactionDistribution(),
    },
    {
      id: 9,
      name: "getActiveDevicesLast24h",
      collection: "transactionActionHistoryInfo",
      pipeline: analyticsQueryLibrary.getActiveDevicesLast24h(),
    },
    {
      id: 10,
      name: "getTopDevicesByRevenue (top 10)",
      collection: "transactionActionHistoryInfo",
      pipeline: analyticsQueryLibrary.getTopDevicesByRevenue(10),
    },
    {
      id: 11,
      name: "getDeviceTransactionFrequency",
      collection: "transactionActionHistoryInfo",
      pipeline: analyticsQueryLibrary.getDeviceTransactionFrequency(),
    },
    {
      id: 12,
      name: "getTransactionModeDistribution",
      collection: "transactionActionHistoryInfo",
      pipeline: analyticsQueryLibrary.getTransactionModeDistribution(),
    },
    {
      id: 13,
      name: "getTransactionTypeDistribution",
      collection: "transactionActionHistoryInfo",
      pipeline: analyticsQueryLibrary.getTransactionTypeDistribution(),
    },
    {
      id: 14,
      name: "getLargestTransactions (top 10)",
      collection: "transactionActionHistoryInfo",
      pipeline: analyticsQueryLibrary.getLargestTransactions(10),
    },
    {
      id: 15,
      name: "getDailyTransactionVolume (30d)",
      collection: "transactionActionHistoryInfo",
      pipeline: analyticsQueryLibrary.getDailyTransactionVolume(30),
    },
    {
      id: 16,
      name: `getHighestRevenueDeviceByMonth (${year}/${month})`,
      collection: "transactionActionHistoryInfo",
      pipeline: analyticsQueryLibrary.getHighestRevenueDeviceByMonth(
        year,
        month,
      ),
    },
    {
      id: 17,
      name: "getAverageRevenuePerDevice",
      collection: "transactionActionHistoryInfo",
      pipeline: analyticsQueryLibrary.getAverageRevenuePerDevice(),
    },
    {
      id: 18,
      name: "getDevicesWithHighestFailures (top 10)",
      collection: "transactionActionHistoryInfo",
      pipeline: analyticsQueryLibrary.getDevicesWithHighestFailures(10),
    },
    {
      id: 19,
      name: "getHighValueTransactions (>=10000)",
      collection: "transactionActionHistoryInfo",
      pipeline: analyticsQueryLibrary.getHighValueTransactions(10000, 20),
    },
    {
      id: 20,
      name: "getRevenueByDayOfWeek",
      collection: "transactionActionHistoryInfo",
      pipeline: analyticsQueryLibrary.getRevenueByDayOfWeek(),
    },
    {
      id: 21,
      name: "getSystemSummary",
      collection: "systemSummaryInfo",
      pipeline: analyticsQueryLibrary.getSystemSummary(),
    },
  ];

  const results = [];

  for (const q of queries) {
    try {
      const col = db.collection(q.collection);
      const data = await col.aggregate(q.pipeline).toArray();
      const hasData = data.length > 0;
      const status = hasData ? "✅ DATA " : "⚠️  EMPTY";
      const preview = hasData
        ? JSON.stringify(data[0]).slice(0, 150)
        : "(no documents)";

      console.log(`[${String(q.id).padStart(2, "0")}] ${status}  ${q.name}`);
      if (hasData) {
        console.log(`       col: ${q.collection}  |  docs: ${data.length}`);
        console.log(`       sample: ${preview}`);
      } else {
        console.log(`       col: ${q.collection}`);
      }
      console.log();

      results.push({
        ...q,
        hasData,
        count: data.length,
        sample: hasData ? data[0] : null,
      });
    } catch (err) {
      console.log(`[${String(q.id).padStart(2, "0")}] ❌ ERROR  ${q.name}`);
      console.log(`       col: ${q.collection}`);
      console.log(`       error: ${err.message}`);
      console.log();
      results.push({ ...q, hasData: false, count: 0, error: err.message });
    }
  }

  console.log("=".repeat(65));
  console.log("SUMMARY");
  console.log("=".repeat(65));

  const working = results.filter((r) => r.hasData);
  const empty = results.filter((r) => !r.hasData && !r.error);
  const errored = results.filter((r) => r.error);

  console.log(`\n✅  Working (${working.length}/${results.length}):`);
  working.forEach((r) =>
    console.log(`    #${r.id}  ${r.name}  →  ${r.count} doc(s)`),
  );

  console.log(`\n⚠️   Empty (${empty.length}/${results.length}):`);
  empty.forEach((r) => console.log(`    #${r.id}  ${r.name}`));

  console.log(`\n❌  Errors (${errored.length}/${results.length}):`);
  errored.forEach((r) => console.log(`    #${r.id}  ${r.name}:  ${r.error}`));

  console.log();
  await client.close();
}

run().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
