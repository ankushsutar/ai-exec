const { dispatchIntent } = require("./src/services/intentDispatcher");
const { extractBIParams } = require("./src/services/biParamExtractor");

const tests = [
  {
    q: "average signal strength by operator",
    expectedIntent: "MONGODB_BI_NETWORK_QUALITY",
  },
  {
    q: "show devices with highest network failures",
    expectedIntent: "MONGODB_BI_NETWORK_FAILURES",
  },
  {
    q: "what is the average device uptime",
    expectedIntent: "MONGODB_BI_AVG_UPTIME",
  },
  { q: "firmware distribution", expectedIntent: "MONGODB_BI_FIRMWARE_DIST" },
  {
    q: "devices that failed to play audio",
    expectedIntent: "MONGODB_BI_AUDIO_FAILURES",
  },
  { q: "device button usage", expectedIntent: "MONGODB_BI_BUTTON_USAGE" },
  {
    q: "data consumption by operator",
    expectedIntent: "MONGODB_BI_DATA_CONSUMPTION",
  },
  {
    q: "reboot analysis for top 5 devices",
    expectedIntent: "MONGODB_BI_REBOOT_ANALYSIS",
  },
];

async function runTests() {
  let pass = 0;
  for (const test of tests) {
    const intent = await dispatchIntent(test.q);

    const intentOK = intent === test.expectedIntent;

    if (intentOK) {
      console.log(`✅ PASS: "${test.q}" -> ${intent}`);
      pass++;
    } else {
      console.log(`❌ FAIL: "${test.q}"`);
      console.log(`   Expected Intent: ${test.expectedIntent}, Got: ${intent}`);
    }
  }
  console.log(`\n${pass}/${tests.length} tests passed.`);
}

runTests();
