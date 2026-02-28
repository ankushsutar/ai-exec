const { Client } = require("pg");
const { MongoClient } = require("mongodb");
const fs = require("fs");
require("dotenv").config({
  path: fs.existsSync("./backend/.env") ? "./backend/.env" : "./.env",
});

async function generateStudy() {
  // --- POSTGRES SECTION ---
  const pgClient = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: false,
  });

  // --- MONGODB SECTION ---
  const mongoUri =
    process.env.MONGO_URI || "mongodb://localhost:27017/paynearby_prod";
  const mongoClient = new MongoClient(mongoUri);

  try {
    console.log("Connecting to SQL database...");
    await pgClient.connect();

    console.log("Connecting to MongoDB...");
    await mongoClient.connect();
    const mongoDb = mongoClient.db();

    let md = "# Database Study: AI-Exec Ecosystem\n\n";
    md += `**Date:** ${new Date().toISOString()}\n`;
    md += `**Scope:** SQL Tables + MongoDB Collections\n\n`;
    md += "--- \n\n";

    // 1. EXTRACT POSTGRES
    console.log("[SQL] Extracting Postgres Schema...");
    const columnsRes = await pgClient.query(`
      SELECT table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      ORDER BY table_name, ordinal_position
    `);

    const fkRes = await pgClient.query(`
      SELECT tc.table_name AS source_table, kcu.column_name AS source_column, ccu.table_name AS target_table, ccu.column_name AS target_column
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
    `);

    const pgTables = {};
    columnsRes.rows.forEach((r) => {
      if (!pgTables[r.table_name])
        pgTables[r.table_name] = { columns: [], relations: [] };
      pgTables[r.table_name].columns.push(r);
    });
    fkRes.rows.forEach((r) => {
      if (pgTables[r.source_table]) pgTables[r.source_table].relations.push(r);
    });

    for (const [tableName, data] of Object.entries(pgTables)) {
      md += `## Table: \`${tableName}\` (SQL)\n\n`;
      md += "| Column | Type | Nullable |\n| :--- | :--- | :--- |\n";
      data.columns.forEach((c) => {
        md += `| ${c.column_name} | ${c.data_type} | ${c.is_nullable} |\n`;
      });
      if (data.relations.length > 0) {
        md += "\n**Relationships:**\n";
        data.relations.forEach((rel) => {
          md += `- \`${rel.source_column}\` -> FK -> \`${rel.target_table}\`\n`;
        });
      }
      md += "\n---\n\n";
    }

    // 2. EXTRACT MONGODB
    console.log("[Mongo] Extracting MongoDB Collections...");
    const collections = await mongoDb.listCollections().toArray();
    for (const coll of collections) {
      if (coll.name.startsWith("system.")) continue;
      if (coll.name === "transactionHistoryInfo") continue; // Deprecated per user request

      console.log(`[Mongo] Sampling ${coll.name}...`);
      const sample = await mongoDb
        .collection(coll.name)
        .find({})
        .limit(3)
        .toArray();

      md += `## Table: \`${coll.name}\` (MONGODB)\n\n`;
      if (sample.length === 0) {
        md += "*(Empty Collection)*\n\n";
      } else {
        md += "| Field | Sample Value |\n| :--- | :--- |\n";
        const keys = Object.keys(sample[0]);
        keys.forEach((k) => {
          if (k !== "_id")
            md += `| ${k} | ${String(sample[0][k]).substring(0, 50)} |\n`;
        });
      }
      md += "\n---\n\n";
    }

    fs.writeFileSync("Database_Study.md", md);
    console.log("Database_Study.md updated with SQL + MongoDB context.");
  } catch (err) {
    console.error("Error generating study:", err);
  } finally {
    await pgClient.end();
    await mongoClient.close();
  }
}

generateStudy();
