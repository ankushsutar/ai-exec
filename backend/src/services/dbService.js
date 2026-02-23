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

async function extractDatabaseSchema(allowedTables = null) {
    try {
        console.log(`[DB Service] Extracting dynamic schema from information_schema...`);

        let query = `
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
        `;
        let queryParams = [];

        if (allowedTables && allowedTables.length > 0) {
            // Build the parameter list ($1, $2, $3...) safely
            const paramPlaceholders = allowedTables.map((_, i) => `$${i + 1}`).join(',');
            query += ` AND table_name IN (${paramPlaceholders}) `;
            queryParams = allowedTables;
        }

        query += ` ORDER BY table_name, ordinal_position;`;

        const result = await db.query(query, queryParams);

        // Group columns by table
        const tables = {};
        for (const row of result.rows) {
            if (!tables[row.table_name]) {
                tables[row.table_name] = [];
            }
            // Format example: id (integer)
            tables[row.table_name].push(`${row.column_name} (${row.data_type})`);
        }

        // Format into the expected LLM string
        let schemaString = '';
        for (const [tableName, columns] of Object.entries(tables)) {
            schemaString += `TABLE: ${tableName}\n`;
            schemaString += `  Columns: ${columns.join(', ')}\n\n`;
        }

        const tableNames = Object.keys(tables).join(', ');
        console.log(`[DB Service] Successfully extracted schema for tables: ${tableNames}`);
        return schemaString.trim();
    } catch (error) {
        console.error(`[DB Service] Schema extraction failed:`, error.message);
        throw error;
    }
}

module.exports = { executeDynamicQuery, extractDatabaseSchema };
