const db = require('../config/db');

async function executeDynamicQuery(sql) {
    try {
        console.log(`[DB Service] Executing query: ${sql.trim()}`);
        const result = await db.query(sql);
        return result.rows;
    } catch (error) {
        console.error(`[DB Service] Query execution failed:`, error.message);
        throw error;
    }
}

module.exports = { executeDynamicQuery };
