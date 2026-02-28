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

  console.log(
    `[Model Router] Analyzing complexity for: "${q.substring(0, 30)}..."`,
  );

  // Factors increasing complexity
  if (/join|combine|merging/i.test(q)) score += 3;
  if (
    /group by|summarize by|total by|revenue|trend|highest|volume|sum/i.test(q)
  )
    score += 5;
  if (/average|mean/i.test(q)) score += 2;
  if (/nested|subquery/i.test(q)) score += 4;
  if (/last|show|list/i.test(q)) score += 1;

  // Entity count heuristic
  const words = q.split(/\s+/);
  if (words.length > 10) score += 2;

  return score;
}

/**
 * Determines the best model for the given question.
 * qwen2.5:0.5b (Fast, small) vs llama3.2 (Capable, larger)
 */
function routeModel(question, options = {}) {
  const complexity = calculateComplexity(question);

  // TIERED ROUTING:
  // - If complexity is low (< 5), use the lightning-fast 0.5b model.
  // - If complexity is high, or we're on a retry/forced mode, use llama3.2.
  // - CRITICAL: Always use llama3.2 for MongoDB until we're sure 0.5b can handle MQL pipelines.
  let model = "qwen2.5:0.5b";

  if (
    complexity >= 5 ||
    options.forceLlama ||
    options.attempt > 1 ||
    options.engine === "mongodb" // MQL is harder than SQL for tiny models
  ) {
    model = "llama3.2:latest";
  }

  console.log(
    `[Model Router] Complexity: ${complexity} | routing to: ${model}${options.forceLlama ? " (FORCED)" : ""}${options.engine ? ` (Engine: ${options.engine})` : ""}`,
  );

  return {
    model,
    complexity,
    isComplex: complexity >= 5,
  };
}

module.exports = { routeModel, calculateComplexity };
