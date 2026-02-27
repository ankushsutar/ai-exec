/**
 * Simple In-memory Cache Service
 * Stores normalized queries and their results to improve latency.
 */

const cache = new Map();
const MAX_CACHE_SIZE = 100;

function getCache(key) {
  return cache.get(normalizeKey(key));
}

function setCache(key, value) {
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(normalizeKey(key), value);
}

function normalizeKey(key) {
  // Simple normalization: trim and lowercase
  return String(key).trim().toLowerCase();
}

module.exports = { getCache, setCache };
