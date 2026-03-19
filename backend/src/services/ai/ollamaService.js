const axios = require("axios");
const config = require("../../config/env");
const AI_CONFIG = require("../../config/aiConfig");

// Extract the base URL from the /api/generate url
const OLLAMA_BASE_URL = config.ollamaUrl.replace("/api/generate", "");
const EMBEDDING_URL = `${OLLAMA_BASE_URL}/api/embeddings`;

async function getLLMSummaryStream(analyticsData, res, question = "") {
  try {
    // Strip out the massive tableData payload to prevent LLM context overload and hallucination
    const sanitizedData = {
      kpis: analyticsData?.kpis || [],
      chartData: analyticsData?.chartData || [],
      metricName: analyticsData?.valueKey || "value",
    };

    const { getSummaryPrompt } = require("../../prompts/summaryPrompt");
    const prompt = getSummaryPrompt(question, analyticsData);

    const response = await axios.post(
      config.ollamaUrl,
      {
        model: AI_CONFIG.MODELS.SUMMARIZER, // Summaries remain on the fastest model
        prompt: prompt,
        stream: true,
        options: {
          temperature: 0,
          top_k: 1,
          top_p: 0.1,
        },
        keep_alive: 0,
        timeout: AI_CONFIG.TIMEOUTS.SUMMARY, // 30 second timeout
      },
      {
        responseType: "stream",
      },
    );

    // Pipe the stream from axios to the Express response
    response.data.pipe(res);
  } catch (error) {
    console.error("Ollama connection error:", error.message);
    res.write(
      JSON.stringify({
        response:
          "Error generating summary: Local LLM is currently unavailable.",
        done: true,
      }) + "\n",
    );
    res.end();
  }
}

async function generateEmbedding(text) {
  try {
    const {
      getCachedEmbedding,
      setCachedEmbedding,
    } = require("../data/vectorStore");
    const cached = getCachedEmbedding(text);
    if (cached) return cached;

    // qwen2.5 model natively supports the /api/embeddings endpoint in Ollama
    const response = await axios.post(
      EMBEDDING_URL,
      {
        model: AI_CONFIG.MODELS.CLASSIFIER,
        prompt: text,
        keep_alive: 0,
      },
      { timeout: AI_CONFIG.TIMEOUTS.SUMMARY },
    ); // 30 second timeout

    const embedding = response.data.embedding;
    setCachedEmbedding(text, embedding);
    return embedding;
  } catch (error) {
    console.error(
      "[Ollama Service] Error generating embedding:",
      error.message,
    );
    throw new Error("Failed to generate embedding vector.");
  }
}

async function generateIntent(question, retrievedFunctions = "") {
  try {
    const { getIntentClassifierPrompt } = require("../../prompts/intentClassifierPrompt");
    const prompt = getIntentClassifierPrompt(question, retrievedFunctions);

    const response = await axios.post(config.ollamaUrl, {
      model: AI_CONFIG.MODELS.CLASSIFIER,
      prompt: prompt,
      format: "json",
      stream: false,
      options: { temperature: 0 },
    }, { timeout: AI_CONFIG.TIMEOUTS.CLASSIFIER });

    return JSON.parse(response.data.response);
  } catch (error) {
    console.error("[Ollama Service] Intent generation failed:", error.message);
    return { intent: "UNKNOWN", dataSources: ["postgres"], entities: {}, needsMerchantLookup: false };
  }
}

async function generateQuery(prompt, engine = "mongo") {
  try {
    const response = await axios.post(config.ollamaUrl, {
      model: AI_CONFIG.MODELS.MQL_GEN,
      prompt: prompt,
      format: "json",
      stream: false,
      options: { temperature: 0 },
    }, { timeout: AI_CONFIG.TIMEOUTS.QUERY_GEN });

    return JSON.parse(response.data.response);
  } catch (error) {
    console.error(`[Ollama Service] ${engine} query generation failed:`, error.message);
    throw error;
  }
}



module.exports = { getLLMSummaryStream, generateEmbedding, generateIntent, generateQuery };
