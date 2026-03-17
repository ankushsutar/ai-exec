const { getSummaryPrompt } = require("../src/prompts/summaryPrompt");
const axios = require("axios");
const AI_CONFIG = require("../src/config/aiConfig");
const config = require("../src/config/env");

const testData = [
  {
    question: "Total revenue today",
    analyticsData: {
      valueKey: "Revenue",
      kpis: [{ name: "Total", value: "₹45,000" }],
      chartData: [{ label: "Today", value: 45000 }]
    }
  },
  {
    question: "How many transactions yesterday?",
    analyticsData: {
      valueKey: "Transaction Volume",
      kpis: [{ name: "Count", value: "1,250" }],
      chartData: [{ label: "Yesterday", value: 1250 }]
    }
  },
  {
    question: "What is the average transaction value?",
    analyticsData: {
      valueKey: "Average Amount",
      kpis: [{ name: "Avg", value: "₹450.50" }],
      chartData: [{ label: "All", value: 450.5 }]
    }
  }
];

async function runTests() {
  console.log("Starting Summary Generation Battery...");
  
  for (const item of testData) {
    const prompt = getSummaryPrompt(item.question, item.analyticsData);
    try {
      const startTime = Date.now();
      const response = await axios.post(config.ollamaUrl, {
        model: AI_CONFIG.MODELS.SUMMARIZER,
        prompt: prompt,
        stream: false,
        options: { temperature: 0 }
      });
      const duration = Date.now() - startTime;
      console.log(`Q: "${item.question}" | Time: ${duration}ms`);
      console.log(`S: ${response.data.response}`);
      console.log("----------------------------------------");
    } catch (err) {
      console.log(`Error: ${err.message}`);
    }
  }
}

runTests();
