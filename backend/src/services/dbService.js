const db = require('../config/db');
const queries = require('../db/queries');

async function executeQueryForIntent(intent) {
    const sql = queries[intent];
    if (!sql) {
        throw new Error(`No SQL mapping found for intent: ${intent}`);
    }

    console.log(`Executing SQL for intent ${intent}: ${sql.trim()}`);
    const result = await db.query(sql);
    return result.rows;
}

module.exports = { executeQueryForIntent };
