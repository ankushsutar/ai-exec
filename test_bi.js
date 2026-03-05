const { dispatchIntent } = require("./backend/src/services/intentDispatcher");
const { orchestrateHybridQuery } = require("./backend/src/services/hybridBroker");

async function test() {
  const q = "Show me the average revenue per active device.";
  console.log("Testing:", q);
  const intent = await dispatchIntent(q);
  console.log("Intent:", intent);
  
  if (intent) {
    console.log("Testing broker...");
    try {
      const res = await orchestrateHybridQuery(q, "test");
      console.log("Result:", JSON.stringify(res, null, 2));
    } catch(e) {
      console.error("Broker err:", e);
    }
  }
}
test().catch(console.error).finally(() => process.exit(0));
