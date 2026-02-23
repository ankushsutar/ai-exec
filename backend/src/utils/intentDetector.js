function detectIntent(question) {
    const q = question.toLowerCase();

    if (q.includes('revenue') && q.includes('region')) {
        return 'REVENUE_BY_REGION';
    }

    if (q.includes('firmware') && q.includes('failure')) {
        return 'FAILURE_BY_FIRMWARE';
    }

    if (q.includes('merchant')) {
        return 'TOP_MERCHANTS';
    }

    return 'UNKNOWN';
}

module.exports = { detectIntent };
