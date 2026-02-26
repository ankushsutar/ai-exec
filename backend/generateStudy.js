const { Client } = require("pg");
const fs = require("fs");
require("dotenv").config({ path: "./.env" });

async function generateStudy() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("Connected to database. Extrapolating schema...");

    // 1. Get all tables and their columns
    const columnsRes = await client.query(`
      SELECT 
        table_name, 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      ORDER BY table_name, ordinal_position
    `);

    // 2. Get Foreign Key relationships
    const fkRes = await client.query(`
      SELECT
        tc.table_name AS source_table, 
        kcu.column_name AS source_column, 
        ccu.table_name AS target_table, 
        ccu.column_name AS target_column
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
    `);

    const tables = {};
    columnsRes.rows.forEach((row) => {
      if (!tables[row.table_name])
        tables[row.table_name] = { columns: [], relations: [] };
      tables[row.table_name].columns.push(row);
    });

    fkRes.rows.forEach((row) => {
      if (tables[row.source_table]) {
        tables[row.source_table].relations.push(row);
      }
    });

    let md = "# Database Study: AI-Exec Ecosystem\n\n";
    md += `**Date:** ${new Date().toISOString()}\n`;
    md += `**Scope:** 45+ Dynamic Enterprise Tables\n\n`;
    md += "--- \n\n";

    for (const [tableName, data] of Object.entries(tables)) {
      md += `## Table: \`${tableName}\`\n\n`;

      md += "| Column | Type | Nullable | Default |\n";
      md += "| :--- | :--- | :--- | :--- |\n";
      data.columns.forEach((col) => {
        md += `| ${col.column_name} | ${col.data_type} | ${col.is_nullable} | ${col.column_default || "-"} |\n`;
      });

      if (data.relations.length > 0) {
        md += "\n**Relationships:**\n";
        data.relations.forEach((rel) => {
          md += `- \`${rel.source_column}\` -> FK -> [\`${rel.target_table}\`](#table-${rel.target_table.toLowerCase()})(\`${rel.target_column}\`)\n`;
        });
      }
      md += "\n---\n\n";
    }

    fs.writeFileSync("Database_Study.md", md);
    console.log("Database_Study.md generated successfully.");
  } catch (err) {
    console.error("Error generating study:", err);
  } finally {
    await client.end();
  }
}

generateStudy();
