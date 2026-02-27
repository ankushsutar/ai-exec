/**
 * Model Router Service
 * Decides which LLM model to use based on query complexity.
 */

const COMPLEXITY_THRESHOLD = 5;

/**
 * Calculates a basic complexity score for a natural language question.
 */
function calculateComplexity(question) {
  let score = 0;
  const q = question.toLowerCase();

  // Factors increasing complexity
  if (q.includes("join") || q.includes("combine") || q.includes("merging"))
    score += 3;
  if (
    q.includes("group by") ||
    q.includes("summarize by") ||
    q.includes("total by")
  )
    score += 2;
  if (q.includes("average") || q.includes("mean") || q.includes("trend"))
    score += 1;
  if (q.includes("nested") || q.includes("subquery")) score += 4;

  // Entity count heuristic
  const words = q.split(/\s+/);
  if (words.length > 15) score += 1;

  return score;
}

/**
 * Determines the best model for the given question.
 * qwen2.5:0.5b (Fast, small) vs llama3.2 (Capable, larger)
 */
function routeModel(question) {
  const complexity = calculateComplexity(question);
  const model =
    complexity >= COMPLEXITY_THRESHOLD ? "llama3.2:latest" : "qwen2.5:0.5b";

  console.log(
    `[Model Router] Complexity: ${complexity} | routing to: ${model}`,
  );

  return {
    model,
    complexity,
    isComplex: complexity >= COMPLEXITY_THRESHOLD,
  };
}

module.exports = { routeModel, calculateComplexity };
