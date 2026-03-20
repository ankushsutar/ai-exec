const { normalizeDateRange } = require('./backend/src/utils/dateNormalizer');

const testCases = [
  "overall revenue",
  "year 2025",
  "2024",
  "last month",
  "this month",
  "Jan 2026",
  "last 7 days"
];

testCases.forEach(q => {
  const range = normalizeDateRange(q);
  console.log(`Query: "${q}"`);
  console.log(`  Start: ${range.start?.toISOString()}`);
  console.log(`  End:   ${range.end?.toISOString()}`);
  console.log('---');
});
