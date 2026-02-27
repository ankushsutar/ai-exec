const { orchestrateHybridQuery } = require("../services/hybridBroker");
const { processAnalytics } = require("../utils/analyticsEngine");
const { getLLMSummaryStream } = require("../services/ollamaService");

async function handleAskData(req, res, next) {
  try {
    const { question } = req.body;
    const requestId = Date.now().toString().slice(-4);
    console.log("\n=======================================");
    console.log(`--- New Hybrid Data Request [#${requestId}] ---`);
    console.time(`TotalRequest_${requestId}`);
    console.log("Received Question:", question);

    let dbData, analytics;
    let attempt = 0;
    let maxAttempts = 2; // Reduced as Broker handles internal retries if needed
    let lastError = "";

    while (attempt < maxAttempts) {
      try {
        attempt++;
        console.log(`\n--- Hybrid Attempt ${attempt}/${maxAttempts} ---`);

        console.time(`Orchestration_Time_${requestId}_att${attempt}`);
        dbData = await orchestrateHybridQuery(question, requestId);
        console.timeEnd(`Orchestration_Time_${requestId}_att${attempt}`);

        console.log("Fetched dbData length:", dbData?.length);
        break;
      } catch (err) {
        console.error(
          `Hybrid Orchestration error on attempt ${attempt}:`,
          err.message,
        );
        lastError = err.message;
        if (attempt >= maxAttempts) {
          return res.status(400).json({
            kpis: [],
            chartData: [],
            intent: "UNKNOWN",
            error: `Hybrid Broker failed after ${maxAttempts} attempts. Error: ${lastError}`,
          });
        }
      }
    }

    // 3. Process Analytics Dynamically
    console.log("\nProcessing Analytics Dynamically...");
    console.time(`Analytics_Time_${requestId}`);
    analytics = processAnalytics(dbData);
    console.timeEnd(`Analytics_Time_${requestId}`);
    console.log("Analytics Result KPI Count:", analytics?.kpis?.length);

    console.log("\nSending dynamic data response back to client.");
    console.timeEnd(`TotalRequest_${requestId}`);
    console.log("=======================================\n");

    return res.json({
      kpis: analytics.kpis,
      chartData: analytics.chartData,
      tableData: analytics.tableData,
      columns: analytics.columns,
      intent: "DYNAMIC",
      rawAnalytics: analytics, // Pass to next step internally if needed
    });
  } catch (error) {
    next(error);
  }
}

async function handleAskSummary(req, res, next) {
  try {
    const { analytics, question } = req.body;
    const requestId = Date.now().toString().slice(-4);
    console.log("\n=======================================");
    console.log(`--- New Summary Request [#${requestId}] ---`);
    console.time(`TotalSummaryRequestTime_${requestId}`);

    if (!analytics) {
      return res.status(400).json({ summary: "No analytics provided." });
    }

    // 4. Generate LLM Summary (Streaming)
    console.log("\nGenerating LLM Summary via Ollama (Streaming)...");

    // Set headers for simple streaming
    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("Transfer-Encoding", "chunked");

    // The service will write to res and end it
    await getLLMSummaryStream(analytics, res, question);

    console.log("\nSummary stream started.");
    console.timeEnd(`TotalSummaryRequestTime_${requestId}`);
    console.log("=======================================\n");

    // Note: res is ended by the getLLMSummaryStream func
  } catch (error) {
    next(error);
  }
}

module.exports = { handleAskData, handleAskSummary };
