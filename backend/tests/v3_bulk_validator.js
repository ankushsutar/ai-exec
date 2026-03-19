const axios = require('axios');

const PROMPTS = [
    { name: "List Top Transactions", q: "Show the top 5 transactions in Feb 2025" },
    { name: "Total Revenue", q: "What is the total revenue for Jan 2025?" },
    { name: "Revenue Trend", q: "Show me the revenue trend for the last 7 days" },
    { name: "Average Transaction Value", q: "What is the average transaction value this week?" },
    { name: "Transaction Volume", q: "Transaction volume for Jan 2025" },
    { name: "Hourly Distribution", q: "Hourly transaction distribution for Jan 2025" },
    { name: "Top Devices by Revenue", q: "Which devices generated the highest revenue in 2025?" },
    { name: "Device Failure Alerts", q: "Show devices with highest failure volume" },
    { name: "Avg Revenue Per Device", q: "What is the average revenue per active device this month?" },
    { name: "Device Failure Analysis", q: "List devices with most failed transactions" },
    { name: "High Value Transactions", q: "List transactions above 10,000 for Jan 2025" },
    { name: "Day of Week Revenue", q: "Show revenue distribution by day of week" },
    { name: "Audio Latency", q: "Show average audio latency for Jan 2025" },
    { name: "Success Rate by Mode", q: "Success rate by mode (UPI vs Card) for Jan 2025" }
];

async function runBulkTest() {
    console.log("🚀 Starting V3 Bulk Validation Suite...\n");
    let passed = 0;
    let failed = 0;

    for (const test of PROMPTS) {
        console.log(`[TESTING] ${test.name.padEnd(25)} | Query: "${test.q}"`);
        try {
            const start = Date.now();
            const response = await axios.post('http://localhost:3001/ask/data', { question: test.q }, { timeout: 60000 });
            const duration = ((Date.now() - start) / 1000).toFixed(2);

            if (response.data && response.data.intent === 'DYNAMIC' && response.data.kpis && response.data.kpis.length > 0) {
                console.log(` ✅ PASS | Time: ${duration}s | KPIs: ${response.data.kpis.length} | Chart: ${response.data.chartData?.length || 0} rows`);
                passed++;
            } else {
                console.log(` ❌ FAIL | Time: ${duration}s | Intent: ${response.data.intent} | Message: No KPIs returned`);
                failed++;
            }
        } catch (err) {
            console.log(` ❌ CRASH | Error: ${err.message}`);
            failed++;
        }
        console.log("-".repeat(80));
    }

    console.log(`\n📊 Final Result: ${passed + failed} Total | ${passed} Passed | ${failed} Failed`);
    if (failed === 0) {
        console.log("🎉 All V3 capabilities are 100% operational!");
    } else {
        console.log("⚠️ Some capabilities require attention.");
    }
}

runBulkTest();
