const axios = require('axios');
const config = require('../config/env');

async function getLLMSummaryStream(analyticsData, res) {
    try {
        const prompt = `You are a senior business analyst. Here is structured company data: ${JSON.stringify(analyticsData)}. Explain insights, risks, and suggest actions under 150 words.`;

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

module.exports = { getLLMSummaryStream };
