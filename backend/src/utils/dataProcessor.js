function processAnalytics(data) {
  if (!data || data.length === 0)
    return { summary: "No data available", kpis: [], chartData: [] };

  // Mask sensitive columns from the data before processing
  const sensitiveKeywords = [
    "password",
    "token",
    "secret",
    "hash",
    "cvv",
    "key",
  ];

  // Helper to flatten nested objects (specifically for Mongo _id structures)
  const flattenRow = (row) => {
    const flat = {};
    Object.keys(row).forEach((key) => {
      if (key === "_id" && typeof row[key] === "object" && row[key] !== null) {
        Object.assign(flat, row[key]);
      } else {
        flat[key] = row[key];
      }
    });
    return flat;
  };

  // BEAUTIFICATION HELPERS
  const formatValue = (key, val, row) => {
    if (val === null || val === undefined) return "N/A";

    // 1. DATE FORMATTING
    if (
      key.toLowerCase().includes("time") ||
      key.toLowerCase().includes("createdat") ||
      key.toLowerCase().includes("updatedat")
    ) {
      try {
        const d = new Date(
          !isNaN(Number(val)) && typeof val !== "string"
            ? Number(val) * (val > 10000000000 ? 1 : 1000)
            : val,
        );
        if (!isNaN(d.getTime())) {
          return d.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
        }
      } catch (e) {}
    }

    // 2. CURRENCY FORMATTING (txnAmt, amount, etc)
    if (
      key.toLowerCase().includes("amt") ||
      key.toLowerCase().includes("amount") ||
      key.toLowerCase().includes("revenue")
    ) {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        const currency = row.currency || row._currency || "INR";
        return new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: currency,
          maximumFractionDigits: 0,
        }).format(num);
      }
    }

    // 3. STATUS MAPPING
    if (key === "actionStatus") {
      const statusMap = {
        0: "PENDING",
        1: "SUCCESS",
        2: "FAILED",
        10: "INITIATED",
      };
      return statusMap[val] || `CODE_${val}`;
    }

    return val;
  };

  data = data.map((row) => {
    const flattened = flattenRow(row);
    const beautifiedRow = { ...flattened };
    Object.keys(beautifiedRow).forEach((key) => {
      const lowerKey = key.toLowerCase();
      // Masking first
      if (sensitiveKeywords.some((keyword) => lowerKey.includes(keyword))) {
        beautifiedRow[key] = "[MASKED]";
        return;
      }

      // Add formatted variant for UI
      const formatted = formatValue(key, flattened[key], flattened);
      if (formatted !== flattened[key]) {
        beautifiedRow[`_${key}_formatted`] = formatted;
      }
    });
    return beautifiedRow;
  });

  const chartData = [];
  const kpis = [];

  // 1. Analyze the structure of the first row
  const firstRow = data[0];
  const keys = Object.keys(firstRow).filter(
    (k) => !k.startsWith("_") && !k.endsWith("_formatted"),
  );

  if (keys.length === 0) {
    return {
      summary: "Data contains no displayable fields",
      kpis: [],
      chartData: [],
      tableData: data,
      columns: [],
    };
  }

  // --- WIDE SINGLE-ROW SUMMARY DETECTION ---
  // If we only have 1 row, but it has many distinct numeric stats or arrays, treat it as a Summary Object.
  const hasArrays = keys.some((k) => Array.isArray(firstRow[k]));
  const numericKeysCount = keys.filter(
    (k) => typeof firstRow[k] === "number",
  ).length;

  if (data.length === 1 && (hasArrays || numericKeysCount > 1)) {
    keys.forEach((key) => {
      const rawVal = firstRow[key];
      // Convert numeric arrays (like hourly counts) into Time-Series Chart Data
      if (
        Array.isArray(rawVal) &&
        rawVal.length > 0 &&
        typeof rawVal[0] === "number"
      ) {
        if (chartData.length === 0) {
          // Only bind the first array found to the primary chart
          rawVal.forEach((val, i) => {
            chartData.push({
              label: `${String(i).padStart(2, "0")}:00`,
              value: val,
            });
          });
        }
      }
      // Convert all flat numbers into distinct KPIs
      else if (
        typeof rawVal === "number" &&
        !key.toLowerCase().includes("time") &&
        key !== "__v"
      ) {
        const formattedVal = formatValue(key, rawVal, firstRow);
        // Clean camelCase into Title Case (e.g. "totalTransactionAmount" -> "Total Transaction Amount")
        let name = key.replace(/([A-Z])/g, " $1").trim();
        name = name.charAt(0).toUpperCase() + name.slice(1);

        kpis.push({
          name: name,
          value: formattedVal !== rawVal ? formattedVal : rawVal,
        });
      }
    });
    return { kpis, chartData, tableData: data, columns: Object.keys(data[0]) };
  }

  // STANDARD MULTI-ROW / AGGREGATION LOGIC ---
  let totalSum = 0;
  let highest = null;
  let lowest = null;

  // A simple heuristic: find the first string-like column for labels, and prioritized number column for values
  const PRIORITIES = [
    { regex: /revenue/i, score: 100 },
    { regex: /txnAmt/i, score: 90 },
    { regex: /amount/i, score: 80 },
    { regex: /amt/i, score: 75 },
    { regex: /total/i, score: 50 },
    { regex: /sum/i, score: 40 },
    { regex: /volume/i, score: 10 },
    { regex: /count/i, score: 5 },
    { regex: /id/i, score: 1 },
  ];

  let labelKey = null;
  let valueKey = null;
  let bestValueScore = -1;

  for (const key of keys) {
    const val = firstRow[key];
    const lowerKey = key.toLowerCase();

    // Label detection
    if (!labelKey && typeof val === "string" && isNaN(Number(val))) {
      labelKey = key;
    }

    // Value detection with priority scoring
    if (!isNaN(Number(val)) || typeof val === "number") {
      let score = 20; // Default base score for any numeric field
      for (const p of PRIORITIES) {
        if (p.regex.test(key)) {
          score = p.score;
          break;
        }
      }

      if (score > bestValueScore) {
        bestValueScore = score;
        valueKey = key;
      }
    }
  }

  // Fallbacks
  if (!labelKey) labelKey = keys.length > 0 ? keys[0] : null;
  if (!valueKey && keys.length > 1) valueKey = keys[1];
  if (!valueKey && keys.length > 0) valueKey = keys[0];

  if (!labelKey || !valueKey) {
    return {
      summary: "Could not identify usable columns for analysis",
      kpis: [],
      chartData: [],
      tableData: data,
      columns: keys,
    };
  }

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

  // Generate dynamic KPIs based on the shape of the data
  if (data.length === 1 && keys.length === 1) {
    // Just a single aggregate value (e.g. "SELECT SUM(amount)")
    kpis.push({ name: `Total ${keys[0].replace("_", " ")}`, value: totalSum });
  } else {
    if (valueKey && valueKey.toLowerCase().includes("id")) {
      kpis.push({ name: "Total count", value: data.length });
    } else {
      const rawKPI = parseFloat(totalSum.toFixed(2));
      const formattedKPI = formatValue(valueKey, rawKPI, data[0]);
      kpis.push({
        name: `Total ${valueKey.replace("_", " ")}`,
        value: formattedKPI !== rawKPI ? formattedKPI : rawKPI,
      });
    }

    // Prevent generating nonsense max/min KPIs when the numeric value is just an ID or uniform (all 1s)
    if (
      valueKey &&
      !valueKey.toLowerCase().includes("id") &&
      totalSum !== data.length
    ) {
      const highestLabel =
        formatValue(labelKey, highest.label, {}) || highest.label;
      const highestValue = formatValue(
        valueKey,
        highest.value,
        data.find((r) => r[labelKey] === highest.label) || {},
      );
      kpis.push({
        name: `Highest by ${valueKey.replace("_", " ")}`,
        value: highest ? `${highestLabel} (${highestValue})` : "N/A",
      });

      const lowestLabel =
        formatValue(labelKey, lowest.label, {}) || lowest.label;
      const lowestValue = formatValue(
        valueKey,
        lowest.value,
        data.find((r) => r[labelKey] === lowest.label) || {},
      );
      kpis.push({
        name: `Lowest by ${valueKey.replace("_", " ")}`,
        value: lowest ? `${lowestLabel} (${lowestValue})` : "N/A",
      });
    }
  }

  // Clear meaningless chart data if the value being plotted is just an identity sequence
  const finalChartData =
    valueKey && valueKey.toLowerCase().includes("id") ? [] : chartData;

  return {
    kpis,
    chartData: finalChartData,
    tableData: data,
    columns: Object.keys(data[0]),
    valueKey: valueKey,
  };
}

module.exports = { processAnalytics };
