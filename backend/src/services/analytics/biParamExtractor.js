/**
 * biParamExtractor.js
 *
 * Deterministic, zero-LLM parameter extraction from user BI prompts.
 * Reads numbers, dates, months, and thresholds directly from natural language.
 *
 * Returns: { days, limit, threshold, year, month }
 * Any field not found in the prompt will fall back to the provided defaults.
 */

const MONTH_NAMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const MONTH_ABBR = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

/**
 * Extracts structured BI parameters from a natural language question.
 *
 * @param {string} question      - Raw user question
 * @param {Date|null} referenceDate - Anchor date from the latest transaction (for offset queries)
 * @param {object} defaults      - Default param values if not found in question
 * @returns {{ days: number, limit: number, threshold: number, year: number, month: number, referenceDate: Date|null }}
 */
function extractBIParams(question, referenceDate = null, defaults = {}) {
  const q = question.toLowerCase();

  const result = {
    days: defaults.days ?? 30,
    limit: defaults.limit ?? 10,
    threshold: defaults.threshold ?? 10000,
    year: defaults.year ?? new Date().getFullYear(),
    month: defaults.month ?? new Date().getMonth() + 1,
    referenceDate: referenceDate,
  };

  // ── DAYS ──────────────────────────────────────────────────────────────────
  // "last 14 days", "past 7 days", "past week", "last month"
  const daysPatterns = [
    { regex: /last\s+(\d+)\s+days?/i, group: 1 },
    { regex: /past\s+(\d+)\s+days?/i, group: 1 },
    { regex: /(\d+)\s+days?\s+ago/i, group: 1 },
    { regex: /last\s+(\d+)\s+weeks?/i, group: 1, multiplier: 7 },
    { regex: /past\s+(\d+)\s+weeks?/i, group: 1, multiplier: 7 },
    { regex: /last\s+week/i, fixed: 7 },
    { regex: /past\s+week/i, fixed: 7 },
    { regex: /last\s+month/i, fixed: 30 },
    { regex: /past\s+month/i, fixed: 30 },
    { regex: /last\s+quarter/i, fixed: 90 },
    { regex: /last\s+year/i, fixed: 365 },
  ];

  for (const p of daysPatterns) {
    const m = q.match(p.regex);
    if (m) {
      if (p.fixed !== undefined) {
        result.days = p.fixed;
      } else {
        const n = parseInt(m[p.group], 10);
        result.days = isNaN(n) ? result.days : n * (p.multiplier || 1);
      }
      break;
    }
  }

  // ── LIMIT ─────────────────────────────────────────────────────────────────
  // "top 5 devices", "show 20", "bottom 15", "first 5"
  const limitPatterns = [
    /\btop\s+(\d+)\b/i,
    /\bbottom\s+(\d+)\b/i,
    /\bfirst\s+(\d+)\b/i,
    /\bshow\s+(\d+)\b/i,
    /\blist\s+(\d+)\b/i,
    /\bget\s+(\d+)\b/i,
    /\b(\d+)\s+devices?\b/i,
    /\b(\d+)\s+transactions?\b/i,
    /\b(\d+)\s+results?\b/i,
    /\b(\d+)\s+records?\b/i,
  ];

  for (const regex of limitPatterns) {
    const m = q.match(regex);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!isNaN(n) && n > 0 && n <= 1000) {
        result.limit = n;
        break;
      }
    }
  }

  // ── THRESHOLD ─────────────────────────────────────────────────────────────
  // "above 50000", "over ₹25,000", "exceeding 100000", "greater than 5000"
  const thresholdPatterns = [
    /(?:above|over|exceeding|greater\s+than|more\s+than)\s+[₹$]?\s*([\d,]+)/i,
    /[₹$]\s*([\d,]+)\s*(?:and\s+above|or\s+more|plus)/i,
    /transactions?\s+(?:of|worth)\s+[₹$]?\s*([\d,]+)\s*(?:or\s+more|and\s+above)/i,
  ];

  for (const regex of thresholdPatterns) {
    const m = q.match(regex);
    if (m) {
      const raw = m[1].replace(/,/g, "");
      const n = parseInt(raw, 10);
      if (!isNaN(n)) {
        result.threshold = n;
        break;
      }
    }
  }

  // ── YEAR ──────────────────────────────────────────────────────────────────
  // "2025", "in 2024", "for 2025"
  const yearMatch = q.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    result.year = parseInt(yearMatch[1], 10);
  }

  // ── MONTH ─────────────────────────────────────────────────────────────────
  // "february", "feb", "in March", "for April"
  for (let i = 0; i < MONTH_NAMES.length; i++) {
    if (q.includes(MONTH_NAMES[i]) || q.includes(MONTH_ABBR[i])) {
      result.month = i + 1; // 1-indexed
      break;
    }
  }

  return result;
}

module.exports = { extractBIParams };
