function processAnalytics(data) {
  if (!data || data.length === 0)
    return { summary: "No data available", kpis: [], chartData: [] };

  // Strip sensitive columns from the data before processing
  const sensitiveKeywords = ["password", "token", "secret", "hash"];
  data = data.map((row) => {
    const safeRow = { ...row };
    Object.keys(safeRow).forEach((key) => {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeywords.some((keyword) => lowerKey.includes(keyword))) {
        delete safeRow[key];
      }
    });
    return safeRow;
  });

  let totalSum = 0;
  let highest = null;
  let lowest = null;
  const chartData = [];

  // 1. Analyze the structure of the first row to determine categories vs series
  const firstRow = data[0];
  const keys = Object.keys(firstRow);

  let labelKey = null;
  let valueKey = null;

  // A simple heuristic: find the first string-like column for labels, and first number column for values
  for (const key of keys) {
    const val = firstRow[key];
    if (!labelKey && typeof val === "string" && isNaN(Number(val))) {
      labelKey = key;
    } else if (!valueKey && (!isNaN(Number(val)) || typeof val === "number")) {
      valueKey = key;
    }
  }

  // Fallbacks
  if (!labelKey) labelKey = keys[0]; // Just use the first column if no explicit string found
  if (!valueKey && keys.length > 1) valueKey = keys[1]; // Use the second column
  if (!valueKey) valueKey = keys[0]; // If only one column, use it for both (rare, e.g. single aggregate)

  data.forEach((row) => {
    const rawVal = row[valueKey];
    const val = parseFloat(rawVal) || 0;
    const label = String(row[labelKey] || "N/A");

    totalSum += val;

    // Only populate chart if we have more than 1 row or explicitly distinct columns
    if (data.length > 1 || keys.length > 1) {
      chartData.push({ label: label, value: val });
    }

    if (!highest || val > highest.value) highest = { label: label, value: val };
    if (!lowest || val < lowest.value) lowest = { label: label, value: val };
  });

  const kpis = [];

  // Generate dynamic KPIs based on the shape of the data
  if (data.length === 1 && keys.length === 1) {
    // Just a single aggregate value (e.g. "SELECT SUM(amount)")
    kpis.push({ name: `Total ${keys[0].replace("_", " ")}`, value: totalSum });
  } else {
    if (valueKey.toLowerCase().includes("id")) {
      kpis.push({ name: "Total count", value: data.length });
    } else {
      kpis.push({
        name: `Total ${valueKey.replace("_", " ")}`,
        value: parseFloat(totalSum.toFixed(2)),
      });
    }

    // Prevent generating nonsense max/min KPIs when the numeric value is just an ID or uniform (all 1s)
    if (!valueKey.toLowerCase().includes("id") && totalSum !== data.length) {
      kpis.push({
        name: `Highest by ${valueKey.replace("_", " ")}`,
        value: highest ? highest.label : "N/A",
      });
      kpis.push({
        name: `Lowest by ${valueKey.replace("_", " ")}`,
        value: lowest ? lowest.label : "N/A",
      });
    }
  }

  // Clear meaningless chart data if the value being plotted is just an identity sequence
  const finalChartData = valueKey.toLowerCase().includes("id") ? [] : chartData;

  return { kpis, chartData: finalChartData, tableData: data, columns: keys };
}

module.exports = { processAnalytics };
