const axios = require("axios");
const config = require("../config/env");
const { generateEmbedding } = require("./ollamaService");
const { getTopSchemasString } = require("./vectorStore");
const { getBestFewShotExample } = require("./knowledgeBase");

/**
 * Generates an MQL (MongoDB Aggregation Pipeline or find query) from a natural language prompt.
 * Optimized for high-volume transaction retrieval.
 */
async function generateMQLFromPrompt(
  question,
  filterContext = {},
  requestId = "N/A",
) {
  console.log(
    `[Mongo Agent] [#${requestId}] Prompting LLM for MQL conversion...`,
  );

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

  const { getMongoPrompt } = require("../prompts/mongoPrompt");
  const { routeModel } = require("./modelRouter");

  const { model } = routeModel(question);
  const prompt = getMongoPrompt(question, topSchemas, filterContext);

  try {
    const response = await axios.post(
      config.ollamaUrl,
      {
        model: model,
        prompt: prompt,
        stream: false,
        format: "json",
      },
      { timeout: 30000 },
    );

    let result = JSON.parse(response.data.response);

    // VALIDATION & ENHANCEMENT
    if (!result.query || !Array.isArray(result.query)) {
      throw new Error(
        "INVALID_PIPELINE: Mongo query must be an aggregation array.",
      );
    }

    // Auto-add $limit 50 if no limit stage exists
    const hasLimit = result.query.some((stage) => stage.$limit);
    if (!hasLimit) {
      result.query.push({ $limit: 50 });
    }

    console.log(`[Mongo Agent] Selected Collection: ${result.collection}`);
    console.log("[Mongo Agent] Generated Query:", JSON.stringify(result.query));
    return result;
  } catch (error) {
    console.error("[Mongo Agent] Error generating MQL:", error.message);
    throw new Error("Failed to generate MQL.");
  }
}

module.exports = { generateMQLFromPrompt };
