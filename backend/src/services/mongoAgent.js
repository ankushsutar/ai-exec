const axios = require("axios");
const config = require("../config/env");
const { generateEmbedding } = require("./ollamaService");
const { getTopSchemasString } = require("./vectorStore");
const { getBestFewShotExample } = require("./knowledgeBase");

/**
 * Generates an MQL (MongoDB Aggregation Pipeline or find query) from a natural language prompt.
 * Optimized for high-volume transaction retrieval.
 */
async function generateMQLFromPrompt(question, filterContext = {}) {
  console.log("[Mongo Agent] Prompting LLM for MQL conversion...");

  let topSchemas = "";
  let fewShotExample = "";
  try {
    const questionEmbedding = await generateEmbedding(question);
    topSchemas = getTopSchemasString(questionEmbedding, question, 3, "mongodb");
    fewShotExample = getBestFewShotExample(questionEmbedding, "mql", 0.7);
  } catch (e) {
    console.error("[Mongo Agent] Schema retrieval failed:", e.message);
    topSchemas = "Unknown Collection Schema";
  }

  const concepts = require("../config/concepts.json");

  const prompt = `
You are a MongoDB expert with access to specific business knowledge.
Return ONLY a valid JSON object with "collection" and "query" keys.

BUSINESS CONCEPTS:
- Primary Revenue Collection: "${concepts.guardrails.mongo.primary_transactions}"
- ID Mapping: ${JSON.stringify(concepts.aliases)}
- Relationship Guide: ${concepts.relationships[0].path}

STRICT RULES:
1. Return ONLY the raw JSON. No markdown, no "json" labels, no commentary.
2. If using an Aggregation Pipeline (Array), it MUST be a flat array of stages: [{"$match":...}, {"$group":...}, {"$sort":...}, {"$limit":...}].
3. DO NOT nest "$match" inside "$group". 
4. ALWAYS use "${concepts.guardrails.mongo.primary_transactions}" for transaction/revenue queries.
5. CONTEXT INJECTION: If provided, use these filters: ${JSON.stringify(filterContext)}.
6. Result Limit: 50.

SCHEMA:
${topSchemas}

${fewShotExample}

QUESTION: "${question}"
JSON RESPONSE:
    `;

  try {
    const response = await axios.post(
      config.ollamaUrl,
      {
        model: "llama3.2:latest",
        prompt: prompt,
        stream: false,
        format: "json",
      },
      { timeout: 30000 },
    );

    let result = JSON.parse(response.data.response);
    console.log(`[Mongo Agent] Selected Collection: ${result.collection}`);
    console.log("[Mongo Agent] Generated Query:", JSON.stringify(result.query));
    return result;
  } catch (error) {
    console.error("[Mongo Agent] Error generating MQL:", error.message);
    throw new Error("Failed to generate MQL.");
  }
}

module.exports = { generateMQLFromPrompt };
