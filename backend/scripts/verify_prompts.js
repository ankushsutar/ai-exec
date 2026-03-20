const fs = require("fs");
const path = require("path");

// Mocking environment and dependencies
const root = path.join(__dirname, "..");
process.env.OLLAMA_URL = "http://localhost:11434/api/generate";

const { dispatchAction } = require(path.join(root, "src/services/ai/actionDispatcher"));
const mongoService = require(path.join(root, "src/services/data/mongoService"));
const TEST_PROMPTS_FILE = path.join(root, "storage/test_prompts.json");

// Mock runMongoQuery to avoid DB load during prompt testing
mongoService.runMongoQuery = async (collection, query) => {
    return [{ mock: true }];
};

async function runVerification() {
    console.log("====================================================");
    console.log("   AI-EXEC COMPREHENSIVE PROMPT VERIFICATION        ");
    console.log("====================================================\n");

    const tests = JSON.parse(fs.readFileSync(TEST_PROMPTS_FILE, "utf8"));
    const results = [];

    for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        console.log(`[${i + 1}/${tests.length}] Testing: "${test.query}"`);
        
        try {
            const start = Date.now();
            const res = await dispatchAction(test.query);
            const duration = ((Date.now() - start) / 1000).toFixed(1);

            const actualAction = res.capabilityId || "UNKNOWN";
            const isMatch = actualAction === test.expectedAction;
            
            results.push({
                query: test.query,
                expected: test.expectedAction,
                actual: actualAction,
                status: isMatch ? "PASSED" : "FAILED",
                duration: duration + "s",
                category: test.category
            });

            console.log(`    -> Result: ${actualAction} (${isMatch ? "✅" : "❌"}) in ${duration}s\n`);
        } catch (error) {
            console.error(`    -> Error: ${error.message}\n`);
            results.push({
                query: test.query,
                expected: test.expectedAction,
                actual: "ERROR",
                status: "FAILED",
                duration: "N/A",
                category: test.category
            });
        }
    }

    // Print Summary Table
    console.log("\n====================================================");
    console.log("                  TEST SUMMARY                      ");
    console.log("====================================================");
    console.log("STATUS | CATEGORY | EXPECTED -> ACTUAL | QUERY");
    console.log("----------------------------------------------------");
    
    let passed = 0;
    results.forEach(r => {
        if (r.status === "PASSED") passed++;
        const icon = r.status === "PASSED" ? "✅" : "❌";
        console.log(`${icon} | ${r.category.padEnd(12)} | ${r.expected.padEnd(15)} -> ${r.actual.padEnd(15)} | ${r.query}`);
    });

    console.log("----------------------------------------------------");
    console.log(`TOTAL: ${tests.length} | PASSED: ${passed} | FAILED: ${tests.length - passed}`);
    console.log("====================================================\n");
}

runVerification();
