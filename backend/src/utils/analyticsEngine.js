function processAnalytics(data) {
    if (!data || data.length === 0) return { summary: "No data available", kpis: [], chartData: [] };

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
        if (!labelKey && typeof val === 'string' && isNaN(Number(val))) {
            labelKey = key;
        } else if (!valueKey && (!isNaN(Number(val)) || typeof val === 'number')) {
            valueKey = key;
        }
    }

    // Fallbacks
    if (!labelKey) labelKey = keys[0]; // Just use the first column if no explicit string found
    if (!valueKey && keys.length > 1) valueKey = keys[1]; // Use the second column
    if (!valueKey) valueKey = keys[0]; // If only one column, use it for both (rare, e.g. single aggregate)

    data.forEach(row => {
        const rawVal = row[valueKey];
        const val = parseFloat(rawVal) || 0;
        const label = String(row[labelKey] || 'N/A');

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
        kpis.push({ name: `Total ${keys[0].replace('_', ' ')}`, value: totalSum });
    } else {
        kpis.push({ name: `Total ${valueKey.replace('_', ' ')}`, value: totalSum });
        kpis.push({ name: `Highest ${labelKey.replace('_', ' ')}`, value: highest ? highest.label : 'N/A' });
        kpis.push({ name: `Lowest ${labelKey.replace('_', ' ')}`, value: lowest ? lowest.label : 'N/A' });
    }

    return { kpis, chartData };
}

module.exports = { processAnalytics };
