const { normalizeDateRange } = require("./backend/src/utils/dateNormalizer");

function test() {
  const cases = ["this month", "this week", "this year", "last 2 months"];
  
  console.log("Current Date:", new Date().toISOString());
  console.log("-----------------------------------------");
  
  cases.forEach(c => {
    const range = normalizeDateRange(c);
    console.log(`Input: "${c}"`);
    console.log(`  Start: ${range.start?.toISOString()}`);
    console.log(`  End:   ${range.end?.toISOString()}`);
    console.log("-----------------------------------------");
  });
}

test();
