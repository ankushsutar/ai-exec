function processAnalytics(intent, data) {
    if (!data || data.length === 0) return { summary: "No data available", kpis: [], chartData: [] };

    let totalSum = 0;
    let highest = null;
    let lowest = null;
    const chartData = [];

    if (intent === 'REVENUE_BY_REGION') {
        data.forEach(row => {
            const val = parseFloat(row.total_revenue) || 0;
            totalSum += val;
            chartData.push({ label: row.region, value: val });

            if (!highest || val > highest.value) highest = { label: row.region, value: val };
            if (!lowest || val < lowest.value) lowest = { label: row.region, value: val };
        });

        return {
            kpis: [
                { name: "Total Revenue", value: totalSum },
                { name: "Top Region", value: highest ? highest.label : 'N/A' },
                { name: "Lowest Region", value: lowest ? lowest.label : 'N/A' }
            ],
            chartData
        };
    }

    if (intent === 'FAILURE_BY_FIRMWARE') {
        data.forEach(row => {
            const val = parseInt(row.failure_count) || 0;
            totalSum += val;
            chartData.push({ label: row.firmware_version, value: val });

            if (!highest || val > highest.value) highest = { label: row.firmware_version, value: val };
            if (!lowest || val < lowest.value) lowest = { label: row.firmware_version, value: val };
        });

        return {
            kpis: [
                { name: "Total Failures", value: totalSum },
                { name: "Most Failing Firmware", value: highest ? highest.label : 'N/A' }
            ],
            chartData
        };
    }

    if (intent === 'TOP_MERCHANTS') {
        data.forEach(row => {
            const val = parseFloat(row.total_revenue) || 0;
            totalSum += val;
            chartData.push({ label: row.merchant_name, value: val });

            if (!highest || val > highest.value) highest = { label: row.merchant_name, value: val };
            if (!lowest || val < lowest.value) lowest = { label: row.merchant_name, value: val };
        });

        return {
            kpis: [
                { name: "Total Revenue (Top 10)", value: totalSum },
                { name: "Top Merchant", value: highest ? highest.label : 'N/A' }
            ],
            chartData
        };
    }

    return { kpis: [], chartData: [] };
}

module.exports = { processAnalytics };
