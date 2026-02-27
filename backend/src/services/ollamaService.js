const axios = require("axios");
const config = require("../config/env");

// Extract the base URL from the /api/generate url
const OLLAMA_BASE_URL = config.ollamaUrl.replace("/api/generate", "");
const EMBEDDING_URL = `${OLLAMA_BASE_URL}/api/embeddings`;

async function getLLMSummaryStream(analyticsData, res, question = "") {
  try {
    // Strip out the massive tableData payload to prevent LLM context overload and hallucination
    const sanitizedData = {
      kpis: analyticsData?.kpis || [],
      chartDataLength: analyticsData?.chartData?.length || 0,
    };

    const { getSummaryPrompt } = require("../prompts/summaryPrompt");
    const prompt = getSummaryPrompt(question, analyticsData);

    const response = await axios.post(
      config.ollamaUrl,
      {
        model: "qwen2.5:0.5b", // Summaries remain on the fastest model
        prompt: prompt,
        stream: true,
        keep_alive: 0,
        timeout: 30000, // 30 second timeout
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
    const { getCachedEmbedding, setCachedEmbedding } = require("./vectorStore");
    const cached = getCachedEmbedding(text);
    if (cached) return cached;

    // qwen2.5 model natively supports the /api/embeddings endpoint in Ollama
    const response = await axios.post(
      EMBEDDING_URL,
      {
        model: "qwen2.5:0.5b",
        prompt: text,
        keep_alive: 0,
      },
      { timeout: 30000 },
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

module.exports = { getLLMSummaryStream, generateEmbedding };
