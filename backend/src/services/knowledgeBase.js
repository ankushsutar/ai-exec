const { generateEmbedding } = require("./ollamaService");
const { cosineSimilarity } = require("./vectorStore");

// A curated list of high-quality examples to guide the small LLM.
const GOLDEN_EXAMPLES = require("../config/golden_examples.json");

let embeddedExamples = [];

/**
 * Embeds the golden questions on server startup so we can perform fast semantic search later.
 */
async function initializeKnowledgeBase() {
  console.log("[Knowledge Base] Initializing Golden Examples...");
  for (const item of GOLDEN_EXAMPLES) {
    try {
      const embedding = await generateEmbedding(item.question);
      embeddedExamples.push({ ...item, embedding });
    } catch (error) {
      console.error(
        `[Knowledge Base] Failed to embed golden example: "${item.question}"`,
        error.message,
      );
    }
  }
  console.log(
    `[Knowledge Base] Successfully embedded ${embeddedExamples.length} golden examples.`,
  );
}

/**
 * Finds the most relevant example based on the user's question and requested type.
 */
function getBestFewShotExample(
  questionEmbedding,
  type = "sql",
  threshold = 0.6,
) {
  if (embeddedExamples.length === 0) return "";

  let bestMatch = null;
  let highestScore = -1;

  for (const item of embeddedExamples) {
    if (item.type !== type) continue;

    const score = cosineSimilarity(questionEmbedding, item.embedding);
    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  if (highestScore >= threshold && bestMatch) {
    console.log(
      `[Knowledge Base] Found matching Golden ${type.toUpperCase()} Example (Score: ${(highestScore * 100).toFixed(1)}%) -> ${bestMatch.question}`,
    );
    return `EXAMPLE TO FOLLOW:\nUser: "${bestMatch.question}"\n${type.toUpperCase()}:\n${bestMatch.content}\n`;
  }

  return "";
}

module.exports = {
  initializeKnowledgeBase,
  getBestFewShotExample,
};
