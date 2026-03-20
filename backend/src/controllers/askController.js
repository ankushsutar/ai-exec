const { orchestrateHybridQuery } = require("../services/ai/hybridBroker");
const { processAnalytics } = require("../utils/dataProcessor");
const { getLLMSummaryStream } = require("../services/ai/ollamaService");

async function handleAskData(req, res, next) {
  try {
    const { question } = req.body;
    const requestId = Date.now().toString().slice(-4);
    console.log("\n=======================================");
    console.log(`--- New Hybrid Data Request [#${requestId}] ---`);
    console.time(`TotalRequest_${requestId}`);
    console.log("Received Question:", question);

    const { logProductionQuery } = require("../services/data/datasetService");
    logProductionQuery(question, "DYNAMIC", { requestId });

    let plannerResult, analytics;
    let attempt = 0;
    let maxAttempts = 2; 
    let lastError = "";

    while (attempt < maxAttempts) {
      try {
        attempt++;
        console.log(`\n--- Hybrid Attempt ${attempt}/${maxAttempts} ---`);

        console.time(`Orchestration_Time_${requestId}_att${attempt}`);
        plannerResult = await orchestrateHybridQuery(question, requestId);
        console.timeEnd(`Orchestration_Time_${requestId}_att${attempt}`);
        break;
      } catch (err) {
        // ... (Error handling remains same or simplified)
        lastError = err.message;
        if (attempt >= maxAttempts) {
          return res.status(400).json({ intent: "UNKNOWN", error: lastError });
        }
      }
    }

    // 3. Process Analytics Dynamically
    console.log("\nProcessing Analytics Dynamically...");
    console.time(`Analytics_Time_${requestId}`);
    analytics = processAnalytics(plannerResult.results || []);
    console.timeEnd(`Analytics_Time_${requestId}`);
    
    // Enrich with intent and capabilities for the summarizer
    analytics.intent = plannerResult.intent;
    analytics.systemCapabilities = plannerResult.systemCapabilities;

    console.log("\nSending dynamic data response back to client.");
    console.timeEnd(`TotalRequest_${requestId}`);
    console.log("=======================================\n");

    return res.json({
      kpis: analytics.kpis,
      chartData: analytics.chartData,
      tableData: analytics.tableData,
      columns: analytics.columns,
      intent: plannerResult.intent,
      rawAnalytics: analytics,
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
