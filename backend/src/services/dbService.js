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
        // PRO AI/ML GROUNDING: Get approximate row count to help LLM distinguish between empty reports and real data
        let rowCount = 0;
        try {
          const countRes = await db.query(
            `SELECT count(*) FROM "${row.table_name}"`,
          );
          rowCount = parseInt(countRes.rows[0].count);
        } catch (e) {}

        tables[row.table_name] = {
          columns: [],
          rowCount: rowCount,
        };
      }

      let colDef = `"${row.column_name}" (${row.data_type})`;

      const colNameLower = row.column_name.toLowerCase();
      const dataTypeLower = row.data_type.toLowerCase();

      // EXTRA INTELLIGENCE: Categorical Samples
      const categoricalKeywords = [
        "status",
        "region",
        "category",
        "method",
        "type",
        "industry",
        "country",
      ];
      if (categoricalKeywords.some((kw) => colNameLower.includes(kw))) {
        try {
          const sampleResult = await db.query(
            `SELECT DISTINCT "${row.column_name}" FROM "${row.table_name}" WHERE "${row.column_name}" IS NOT NULL LIMIT 5;`,
          );
          const samples = sampleResult.rows.map((r) => r[row.column_name]);
          if (samples.length > 0) {
            colDef += ` [Samples: ${samples.join(", ")}]`;
          }
        } catch (e) {}
      }

      // EXTRA INTELLIGENCE: Numerical Statistics (Price, Salary, Amount, etc.)
      const numericKeywords = [
        "price",
        "salary",
        "amount",
        "total",
        "rating",
        "level",
        "temperature",
      ];
      if (
        numericKeywords.some((kw) => colNameLower.includes(kw)) ||
        dataTypeLower.includes("int") ||
        dataTypeLower.includes("decimal") ||
        dataTypeLower.includes("numeric")
      ) {
        try {
          const res = await db.query(
            `SELECT MIN("${row.column_name}") as min_val, MAX("${row.column_name}") as max_val FROM "${row.table_name}";`,
          );
          if (res.rows[0].min_val !== null) {
            colDef += ` [Range: ${res.rows[0].min_val} to ${res.rows[0].max_val}]`;
          }
        } catch (e) {}
      }

      // EXTRA INTELLIGENCE: Date Ranges
      if (
        dataTypeLower.includes("date") ||
        dataTypeLower.includes("timestamp")
      ) {
        try {
          const res = await db.query(
            `SELECT MIN("${row.column_name}") as min_date, MAX("${row.column_name}") as max_date FROM "${row.table_name}";`,
          );
          if (res.rows[0].min_date !== null) {
            const minStr = new Date(res.rows[0].min_date)
              .toISOString()
              .split("T")[0];
            const maxStr = new Date(res.rows[0].max_date)
              .toISOString()
              .split("T")[0];
            colDef += ` [Period: ${minStr} to ${maxStr}]`;
          }
        } catch (e) {}
      }

      if (fks[row.table_name] && fks[row.table_name][row.column_name]) {
        const fk = fks[row.table_name][row.column_name];
        colDef += ` [FOREIGN KEY pointing to "${fk.table}"."${fk.column}"]`;
      }

      tables[row.table_name].columns.push(colDef);
    }

    // Format into the expected LLM string
    let schemaString = "";
    for (const [tableName, info] of Object.entries(tables)) {
      schemaString += `TABLE: "${tableName}" [Rows: ${info.rowCount}]\n`;
      schemaString += `  Columns: ${info.columns.join(", ")}\n\n`;
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
