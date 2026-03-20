const { planAndExecute } = require("./backend/src/services/ai/queryPlanner");
const { getSummaryPrompt } = require("./backend/src/prompts/summaryPrompt");

async function test() {
  const question = "What is the capital of France?";
  console.log(`Testing: "${question}"`);
  
  // 1. Plan and Execute
  const actionResult = await planAndExecute(question);
  console.log("Planner Intent:", actionResult.intent);
  console.log("System Capabilities:", actionResult.systemCapabilities);

  // 2. Simulate Controller enrichment
  const analytics = {
    intent: actionResult.intent,
    systemCapabilities: actionResult.systemCapabilities,
    kpis: [],
    chartData: []
  };

  // 3. Generate Prompt (to see if it hits the UNKNOWN block)
  const prompt = getSummaryPrompt(question, analytics);
  console.log("\n--- Generated Prompt Snippet ---");
  console.log(prompt.substring(0, 500));
}

test().catch(console.error);
