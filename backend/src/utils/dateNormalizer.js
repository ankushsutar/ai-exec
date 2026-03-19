/**
 * dateNormalizer.js
 * 
 * Converts natural language time expressions into absolute Date ranges.
 * Supports: "Jan 2025", "last 6 months", "today", "yesterday", "2024".
 */

function normalizeDateRange(timeStr) {
  if (!timeStr) return { start: null, end: null };
  const q = timeStr.toLowerCase();
  const now = new Date();
  let start, end;

  // 1. Specific Month/Year (e.g. "Jan 2025")
  const monthMatch = q.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\s*(20\d{2})?/i);
  if (monthMatch) {
    const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    const monthAbbr = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    
    let monthIdx = monthNames.indexOf(monthMatch[1].toLowerCase());
    if (monthIdx === -1) monthIdx = monthAbbr.indexOf(monthMatch[1].toLowerCase());
    
    const year = monthMatch[2] ? parseInt(monthMatch[2], 10) : now.getFullYear();
    
    start = new Date(Date.UTC(year, monthIdx, 1));
    end = new Date(Date.UTC(year, monthIdx + 1, 0, 23, 59, 59, 999));
    return { start, end };
  }

  // 2. Relative "Last N Months"
  const multiMonthMatch = q.match(/last\s+(\d+)\s+months?/i);
  if (multiMonthMatch) {
    const months = parseInt(multiMonthMatch[1], 10);
    end = new Date();
    start = new Date(end.getFullYear(), end.getMonth() - months, 1);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  // 3. Simple Relative (today, yesterday, last week)
  if (q.includes("today")) {
    start = new Date();
    start.setHours(0, 0, 0, 0);
    end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  
  if (q.includes("yesterday")) {
    start = new Date();
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end = new Date();
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  // 4. Specific Year (e.g. "in 2024")
  const yearMatch = q.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    start = new Date(Date.UTC(year, 0, 1));
    end = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
    return { start, end };
  }

  // Default: Fallback to last 30 days if unrecognized but mentions "time"
  start = new Date();
  start.setDate(start.getDate() - 30);
  end = new Date();
  return { start, end };
}

module.exports = { normalizeDateRange };
