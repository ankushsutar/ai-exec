const db = require("../config/db");

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
    console.log(
      `[DB Service] Extracting dynamic schema from information_schema...`,
    );

    let query = `
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
        `;

    let fkQuery = `
            SELECT
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM
                information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
        `;

    let queryParams = [];

    if (allowedTables && allowedTables.length > 0) {
      // Build the parameter list ($1, $2, $3...) safely
      const paramPlaceholders = allowedTables
        .map((_, i) => `$${i + 1}`)
        .join(",");
      query += ` AND table_name IN (${paramPlaceholders}) `;
      fkQuery += ` AND tc.table_name IN (${paramPlaceholders}) `;
      queryParams = allowedTables;
    }

    query += ` ORDER BY table_name, ordinal_position;`;

    const result = await db.query(query, queryParams);
    const fkResult = await db.query(fkQuery, queryParams);

    const fks = {};
    for (const row of fkResult.rows) {
      if (!fks[row.table_name]) fks[row.table_name] = {};
      fks[row.table_name][row.column_name] = {
        table: row.foreign_table_name,
        column: row.foreign_column_name,
      };
    }

    // Group columns by table
    const tables = {};
    for (const row of result.rows) {
      if (!tables[row.table_name]) {
        tables[row.table_name] = [];
      }

      let colDef = `"${row.column_name}" (${row.data_type})`;
      if (fks[row.table_name] && fks[row.table_name][row.column_name]) {
        const fk = fks[row.table_name][row.column_name];
        colDef += ` FK -> "${fk.table}"("${fk.column}")`;
      }

      tables[row.table_name].push(colDef);
    }

    // Format into the expected LLM string
    let schemaString = "";
    for (const [tableName, columns] of Object.entries(tables)) {
      schemaString += `TABLE: "${tableName}"\n`;
      schemaString += `  Columns: ${columns.join(", ")}\n\n`;
    }

    const tableNames = Object.keys(tables).join(", ");
    console.log(
      `[DB Service] Successfully extracted schema for tables: ${tableNames}`,
    );
    return schemaString.trim();
  } catch (error) {
    console.error(`[DB Service] Schema extraction failed:`, error.message);
    throw error;
  }
}

module.exports = { executeDynamicQuery, extractDatabaseSchema };
