const fs = require("fs");
const path = require("path");
const { generateEmbedding } = require("./ollamaService");
const { cosineSimilarity } = require("./vectorStore");

// A curated list of high-quality examples to guide the small LLM.
const GOLDEN_EXAMPLES = require("../config/golden_examples.json");
const ERROR_KB_FILE = path.join(__dirname, "../config/error_kb.json");

let embeddedExamples = [];
let errorKnowledge = [];

/**
 * Embeds the golden questions and learned errors on server startup.
 */
async function initializeKnowledgeBase() {
  console.log("[Knowledge Base] Initializing Golden Examples & Error KB...");

  // Load Learned Errors
  try {
    if (fs.existsSync(ERROR_KB_FILE)) {
      errorKnowledge = JSON.parse(fs.readFileSync(ERROR_KB_FILE, "utf8"));
    }
  } catch (e) {
    console.warn("[Knowledge Base] Failed to load error_kb.json:", e.message);
  }

  const itemsToEmbed = [...GOLDEN_EXAMPLES, ...errorKnowledge];

  for (const item of itemsToEmbed) {
    try {
      const embedding = await generateEmbedding(item.question);
      embeddedExamples.push({ ...item, embedding });
    } catch (error) {
      console.error(
        `[Knowledge Base] Failed to embed example/error: "${item.question}"`,
        error.message,
      );
    }
  }
  console.log(
    `[Knowledge Base] Successfully initialized ${embeddedExamples.length} knowledge items.`,
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
    const label =
      bestMatch.type === "error" ? "LEARNED FIX" : bestMatch.type.toUpperCase();
    console.log(
      `[Knowledge Base] Found matching ${label} (Score: ${(highestScore * 100).toFixed(1)}%) -> ${bestMatch.question}`,
    );
    return `EXAMPLE TO FOLLOW (${label}):\nUser: "${bestMatch.question}"\n${type === "error" ? "FIXED SQL" : type.toUpperCase()}:\n${bestMatch.content}\n`;
  }

  return "";
}

/**
 * Persists a new learned fix from a successful self-correction.
 */
async function recordLearnedFix(question, fixedSql) {
  try {
    const newEntry = {
      question,
      content: fixedSql,
      type: "error",
      createdAt: new Date().toISOString(),
    };

    errorKnowledge.push(newEntry);
    fs.writeFileSync(ERROR_KB_FILE, JSON.stringify(errorKnowledge, null, 2));

    // Dynamically embed and add to memory store for immediate effectiveness
    const embedding = await generateEmbedding(question);
    embeddedExamples.push({ ...newEntry, embedding });

    console.log(
      `[Knowledge Base] Learned and indexed a new fix for: "${question}"`,
    );
  } catch (error) {
    console.error(
      "[Knowledge Base] Failed to record learned fix:",
      error.message,
    );
  }
}

module.exports = {
  initializeKnowledgeBase,
  getBestFewShotExample,
  recordLearnedFix,
};
