const fs = require("fs");
const axios = require("axios");
require("dotenv").config({ path: "./backend/.env" });

const OLLAMA_URL =
  process.env.OLLAMA_URL || "http://localhost:11434/api/generate";

async function train() {
  console.log("[Trainer] Reading Database_Study.md...");
  const studyPath = "../Database_Study.md";
  if (!fs.existsSync(studyPath)) {
    console.error("Database_Study.md not found. Run generateStudy.js first.");
    return;
  }

  const content = fs.readFileSync(studyPath, "utf8");
  const tableBlocks = content.split("## Table: ").slice(1);
  const knowledgeBase = {};

  console.log(`[Trainer] Found ${tableBlocks.length} tables to summarize.`);

  for (const block of tableBlocks) {
    const tableName = block.split("\n")[0].replace(/`/g, "").trim();
    const tableContext = block.split("---")[0].trim();

    try {
      process.stdout.write(`[Trainer] Summarizing ${tableName}... `);
      const prompt = `
        You are a Database Architect.
        Summarize the literal PURPOSE of the table below based on its columns and relations.
        - Table: ${tableName}
        - Schema:
        ${tableContext}

        TASK:
        - Provide a 1-sentence description (max 20 words).
        - Start with its functional role (e.g. "Stores...", "Maps...", "Logs...").
        - Use ONLY the provided information.
        - Return ONLY the sentence.

        SUMMARY:`;

      const response = await axios.post(OLLAMA_URL, {
        model: "qwen2.5:0.5b",
        prompt: prompt,
        stream: false,
        options: { temperature: 0 },
      });

      const summary = response.data.response.trim();
      knowledgeBase[tableName] = summary;
      process.stdout.write("Done.\n");
    } catch (err) {
      process.stdout.write("FAILED.\n");
      console.error(`Error summarizing ${tableName}:`, err.message);
    }
  }

  fs.writeFileSync(
    "knowledge_base.json",
    JSON.stringify(knowledgeBase, null, 2),
  );
  console.log(
    "[Trainer] Knowledge injection complete. Saved to backend/knowledge_base.json.",
  );
}

train();
