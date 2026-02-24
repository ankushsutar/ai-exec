const { generateSQLFromPrompt } = require("../services/sqlAgent");
const { executeDynamicQuery } = require("../services/dbService");
const { processAnalytics } = require("../utils/analyticsEngine");
const { getLLMSummaryStream } = require("../services/ollamaService");

async function handleAskData(req, res, next) {
  try {
    const { question } = req.body;
    const requestId = Date.now().toString().slice(-4);
    console.log("\n=======================================");
    console.log(`--- New Dynamic SQL Data Request [#${requestId}] ---`);
    console.time(`TotalRequest_${requestId}`);
    console.log("Received Question:", question);

    let sqlQuery, dbData, analytics;
    let attempt = 0;
    let maxAttempts = 3;
    let lastError = "";

    while (attempt < maxAttempts) {
      try {
        attempt++;
        console.log(`\n--- Attempt ${attempt}/${maxAttempts} ---`);

        // 1. Generate SQL via LLM Agent
        console.log("\nGenerating SQL for prompt...");
        let promptVariation = question;
        if (lastError) {
          promptVariation = `${question}\n\nCRITICAL WARNING: Your previous SQL failed with this exact PostgreSQL error: "${lastError}". \n\nYou MUST fix this by ONLY using the exact tables and columns provided in the schema. Do NOT invent or guess tables (e.g., if there is no 'salaries' table, look for a 'salary' column in 'employees').`;
        }

        console.time("SQL_Gen_Time");
        sqlQuery = await generateSQLFromPrompt(promptVariation);
        console.timeEnd("SQL_Gen_Time");

        // 2. Fetch Data Dynamically
        console.log("\nExecuting Dynamic SQL...");
        console.time("DB_Fetch_Time");
        dbData = await executeDynamicQuery(sqlQuery);
        console.timeEnd("DB_Fetch_Time");
        console.log("Fetched dbData length:", dbData?.length);

        // If we get here, the query succeeded! Break the retry loop.
        break;
      } catch (agentError) {
        console.error(
          `Agent/DB Execution error on attempt ${attempt}:`,
          agentError.message,
        );
        lastError = agentError.message;

        if (attempt >= maxAttempts) {
          // Fallback for UI if generating/executing SQL fails completely after retries
          return res.status(400).json({
            kpis: [],
            chartData: [],
            intent: "UNKNOWN",
            error: `Could not generate a valid SQL query after ${maxAttempts} attempts. Final Error: ${lastError}`,
          });
        }
      }
    }

    // 3. Process Analytics Dynamically
    console.log("\nProcessing Analytics Dynamically...");
    console.time("Analytics_Time");
    analytics = processAnalytics(dbData);
    console.timeEnd("Analytics_Time");
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
    console.log("\n=======================================");
    console.log("--- New Summary Request ---");
    console.time("TotalSummaryRequestTime");

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
    console.timeEnd("TotalSummaryRequestTime");
    console.log("=======================================\n");

    // Note: res is ended by the getLLMSummaryStream func
  } catch (error) {
    next(error);
  }
}

module.exports = { handleAskData, handleAskSummary };
