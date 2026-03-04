const axios = require("axios");
const config = require("../config/env");
const { getBestFewShotExample } = require("./knowledgeBase");
const { generateEmbedding } = require("./ollamaService");

/**
 * Classifies a user question into an (Entity, Intent) pair.
 * Uses Semantic Search (Knowledge Base) for speed and LLM as fallback.
 */
async function classifyIntent(question) {
  try {
    const questionEmbedding = await generateEmbedding(question);

    // 1. Try Knowledge Base first (Highest Speed)
    // We check all types (sql, mql, hybrid) to find the best blueprint
    const types = ["sql", "mql", "hybrid"];
    let bestMatch = null;
    let highestScore = -1;

    for (const type of types) {
      const match = getBestFewShotExample(questionEmbedding, type, 0.85); // High threshold for auto-bypass
      if (match && match.score > highestScore) {
        highestScore = match.score;
        bestMatch = match;
      }
    }

    if (bestMatch && bestMatch.intent) {
      // ENTITY DISAMBIGUATION: Check if the best match's entity is actually in the question
      // This prevents "User" questions from hitting "Merchant" blueprints blindly.
      const lowercaseQ = question.toLowerCase();
      const entityKeywords = {
        Merchant: ["merchant", "business", "store"],
        User: ["user", "customer", "person", "name"],
        Device: ["device", "terminal", "machine", "pos"],
        Transaction: ["transaction", "txn", "sale", "order"],
      };

      const expectedEntity = bestMatch.entity;
      const otherEntities = Object.keys(entityKeywords).filter(
        (e) => e !== expectedEntity,
      );

      // If a different entity is CLEARLY mentioned, but not the expected one, we trigger LLM fallback
      const hasConflict = otherEntities.some(
        (e) =>
          entityKeywords[e].some((k) => lowercaseQ.includes(k)) &&
          !entityKeywords[expectedEntity].some((k) => lowercaseQ.includes(k)),
      );

      if (highestScore > 0.95 || !hasConflict) {
        console.log(
          `[Intent Classifier] Semantic Hit: ${bestMatch.intent} (${bestMatch.entity}) [Confidence: ${highestScore.toFixed(2)}]`,
        );
        return {
          intent: bestMatch.intent,
          entity: bestMatch.entity,
          type: bestMatch.type,
          blueprint: bestMatch,
          confidence: highestScore,
        };
      } else {
        console.warn(
          `[Intent Classifier] Semantic Collision detected (${expectedEntity} match but question looks different). Falling back.`,
        );
      }
    }

    // 2. LLM Fallback (Deeper Reasoning)
    console.log(
      "[Intent Classifier] Semantic miss, falling back to LLM classification...",
    );
    const classificationPrompt = `
Identify the "Entity" and "Intent" for the following user question.

USER QUESTION: "${question}"

CATEGORIES:
Entities: ["Transaction", "Merchant", "Device", "User", "System"]
Intents: ["TREND", "VOLUME", "LIST", "LOOKUP", "STATS", "REVENUE", "SUMMARY"]

INSTRUCTIONS:
- Return ONLY a JSON object with keys "entity" and "intent".
- Be precise.

JSON:`;

    const { routeModel } = require("./modelRouter");
    const { model } = routeModel(question, { forceSmall: true });

    const response = await axios.post(config.ollamaUrl, {
      model: model,
      prompt: classificationPrompt,
      format: "json",
      stream: false,
      options: { temperature: 0 },
    });

    const result = JSON.parse(response.data.response);
    console.log(
      `[Intent Classifier] LLM Categorized: ${result.intent} on ${result.entity}`,
    );

    return {
      intent: result.intent,
      entity: result.entity,
      confidence: 0.7, // Default confidence for LLM classification
    };
  } catch (error) {
    console.error("[Intent Classifier] Classification failed:", error.message);
    return null;
  }
}

module.exports = { classifyIntent };
