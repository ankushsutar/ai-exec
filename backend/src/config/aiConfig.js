/**
 * Centralized AI Configuration
 * 
 * This file defines the models and parameters used by different agents.
 * Centralizing this ensures that switching models or adjusting timeouts
 * doesn't require hunting through multiple service files.
 */

module.exports = {
  // MODEL DEFINITIONS
  MODELS: {
    CLASSIFIER: "qwen2.5:0.5b",    // Fastest for intent detection
    MAPPING: "qwen2.5:0.5b",       // Fast for parameter mapping
    SUMMARIZER: "qwen2.5:0.5b",    // Fastest for real-time summaries
    SQL_GEN: "llama3.2",           // Balanced for SQL
    MQL_GEN: "llama3.2",           // Balanced for MongoDB Aggregations
    COMPLEX_REASONER: "qwen2.5",   // More capable model for complex planning
  },

  // TIMEOUTS (in milliseconds)
  TIMEOUTS: {
    CLASSIFIER: 60000,             // Increased to 60s for slower environments
    QUERY_GEN: 90000,              // Increased to 90s for Llama 3.2
    SUMMARY: 45000,
    MAPPING: 20000,
  },

  // PIPELINE DEFAULTS
  DEFAULTS: {
    LIMIT: 50,
    TEMPERATURE: 0,
  }
};
