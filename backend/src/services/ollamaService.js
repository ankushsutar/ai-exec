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

    const prompt = `
            You are a sharp, "no-nonsense" Data Analyst.
            
            USER QUESTION: "${question}"
            KEY METRICS: ${JSON.stringify(sanitizedData)}

            TASK:
            1. Provide a concise factual summary of the KEY METRICS data above.
            2. DO NOT hallucinate attributes, risks, or names that do not exist strictly in the KEY METRICS provided.
            3. If the data is just a count (e.g. Total id: 10), simply state "There are 10 items in total" and DO NOT invent risks.
            4. Keep the total word count under 80 words. Never invent missing columns.
        `;

    const response = await axios.post(
      config.ollamaUrl,
      {
        model: "qwen2.5:0.5b",
        prompt: prompt,
        stream: true,
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
    // qwen2.5 model natively supports the /api/embeddings endpoint in Ollama
    const response = await axios.post(EMBEDDING_URL, {
      model: "qwen2.5:0.5b",
      prompt: text,
    });

    return response.data.embedding;
  } catch (error) {
    console.error(
      "[Ollama Service] Error generating embedding:",
      error.message,
    );
    throw new Error("Failed to generate embedding vector.");
  }
}

module.exports = { getLLMSummaryStream, generateEmbedding };
