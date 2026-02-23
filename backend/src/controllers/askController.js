const { detectIntent } = require('../utils/intentDetector');
const { executeQueryForIntent } = require('../services/dbService');
const { processAnalytics } = require('../utils/analyticsEngine');
const { getLLMSummaryStream } = require('../services/ollamaService');

async function handleAskData(req, res, next) {
    try {
        const { question } = req.body;
        console.log('\n=======================================');
        console.log('--- New Data Request ---');
        console.time('TotalDataRequestTime');
        console.log('Received Question:', question);

        // 1. Detect Intent
        const intent = detectIntent(question);
        console.log('Detected Intent:', intent);
        if (intent === 'UNKNOWN') {
            return res.status(400).json({
                kpis: [],
                chartData: [],
                intent: 'UNKNOWN'
            });
        }

        // 2. Fetch Data
        let dbData = [];
        try {
            console.log('\nFetching Data for intent:', intent);
            console.time('DB_Fetch_Time');
            dbData = await executeQueryForIntent(intent);
            console.timeEnd('DB_Fetch_Time');
            console.log('Fetched dbData length:', dbData?.length);
        } catch (e) {
            console.error("DB Execution error:", e.message);
        }

        // 3. Process Analytics
        console.log('\nProcessing Analytics...');
        console.time('Analytics_Time');
        const analytics = processAnalytics(intent, dbData);
        console.timeEnd('Analytics_Time');
        console.log('Analytics Result KPI Count:', analytics?.kpis?.length);
        console.log('Analytics Result Chart Data Count:', analytics?.chartData?.length);

        console.log('\nSending data response back to client.');
        console.timeEnd('TotalDataRequestTime');
        console.log('=======================================\n');

        return res.json({
            kpis: analytics.kpis,
            chartData: analytics.chartData,
            intent: intent,
            rawAnalytics: analytics // Pass to next step internally if needed
        });

    } catch (error) {
        next(error);
    }
}

async function handleAskSummary(req, res, next) {
    try {
        const { analytics } = req.body;
        console.log('\n=======================================');
        console.log('--- New Summary Request ---');
        console.time('TotalSummaryRequestTime');

        if (!analytics) {
            return res.status(400).json({ summary: "No analytics provided." });
        }

        // 4. Generate LLM Summary (Streaming)
        console.log('\nGenerating LLM Summary via Ollama (Streaming)...');

        // Set headers for simple streaming
        res.setHeader('Content-Type', 'application/x-ndjson');
        res.setHeader('Transfer-Encoding', 'chunked');

        // The service will write to res and end it
        await getLLMSummaryStream(analytics, res);

        console.log('\nSummary stream started.');
        console.timeEnd('TotalSummaryRequestTime');
        console.log('=======================================\n');

        // Note: res is ended by the getLLMSummaryStream func

    } catch (error) {
        next(error);
    }
}

module.exports = { handleAskData, handleAskSummary };
