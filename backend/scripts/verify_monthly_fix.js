const { dispatchIntent } = require("./src/services/intentDispatcher");
const { extractBIParams } = require("./src/services/biParamExtractor");

const tests = [
  {
    q: "best device in January 2025",
    expectedIntent: "MONGODB_BI_HIGH_REV_DEV_MONTH",
    expectedParams: { month: 1, year: 2025 },
  },
  {
    q: "best device for Feb 2025",
    expectedIntent: "MONGODB_BI_HIGH_REV_DEV_MONTH",
    expectedParams: { month: 2, year: 2025 },
  },
  {
    q: "top 5 devices by revenue",
    expectedIntent: "MONGODB_BI_TOP_DEVICES_REV",
    expectedParams: { limit: 5 },
  },
  {
    q: "largest 3 transactions in March 2025",
    expectedIntent: "MONGODB_BI_LARGEST_TXNS",
    expectedParams: { limit: 3, month: 3, year: 2025 },
  },
];

async function runTests() {
  let pass = 0;
  for (const test of tests) {
    const intent = await dispatchIntent(test.q);
    const params = extractBIParams(test.q);

    const intentOK = intent === test.expectedIntent;
    const paramsOK = Object.entries(test.expectedParams).every(
      ([k, v]) => params[k] === v,
    );

    if (intentOK && paramsOK) {
      console.log(`✅ PASS: "${test.q}"`);
      pass++;
    } else {
      console.log(`❌ FAIL: "${test.q}"`);
      console.log(`   Expected Intent: ${test.expectedIntent}, Got: ${intent}`);
      console.log(
        `   Expected Params: ${JSON.stringify(test.expectedParams)}, Got: ${JSON.stringify(params)}`,
      );
    }
  }
  console.log(`\n${pass}/${tests.length} tests passed.`);
}

runTests();
