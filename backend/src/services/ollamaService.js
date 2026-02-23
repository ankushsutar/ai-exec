const axios = require('axios');
const config = require('../config/env');

// Extract the base URL from the /api/generate url
const OLLAMA_BASE_URL = config.ollamaUrl.replace('/api/generate', '');
const EMBEDDING_URL = `${OLLAMA_BASE_URL}/api/embeddings`;

async function getLLMSummaryStream(analyticsData, res, question = '') {
    try {
        const prompt = `
            You are a sharp, "no-nonsense" Senior Business Executive Analyst.
            
            USER QUESTION: "${question}"
            DATA: ${JSON.stringify(analyticsData)}

            TASK:
            1. Provide a concise executive summary of the data above in 3 sections: Insights, Risks, and Actions.
            2. Be authoritative and decisive. If a number is high, say it's "Strong Performance". If low, say it's a "Critical Deficit".
            3. DO NOT use generic phrases like "more data needed" or "it lacks specific information".
            4. If the data is a single number (e.g. 275 stock), explain what that means for the business operations (e.g. "We have a steady inventory buffer").
            5. Keep the total word count under 120 words.
        `;

        const response = await axios.post(config.ollamaUrl, {
            model: 'qwen2.5:0.5b',
            prompt: prompt,
            stream: true
        }, {
            responseType: 'stream'
        });

        // Pipe the stream from axios to the Express response
        response.data.pipe(res);

    } catch (error) {
        console.error('Ollama connection error:', error.message);
        res.write(JSON.stringify({ response: "Error generating summary: Local LLM is currently unavailable.", done: true }) + '\n');
        res.end();
    }
}

async function generateEmbedding(text) {
    try {
        // qwen2.5 model natively supports the /api/embeddings endpoint in Ollama
        const response = await axios.post(EMBEDDING_URL, {
            model: 'qwen2.5:0.5b',
            prompt: text
        });

        return response.data.embedding;
    } catch (error) {
        console.error('[Ollama Service] Error generating embedding:', error.message);
        throw new Error('Failed to generate embedding vector.');
    }
}

module.exports = { getLLMSummaryStream, generateEmbedding };
