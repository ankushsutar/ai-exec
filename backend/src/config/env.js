const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

module.exports = {
  port: process.env.PORT || 3001,
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  mongoUri: process.env.MONGO_URI || "mongodb://cwd407:cwd407@10.0.0.72:27017/?authSource=admin",
  ollamaUrl: process.env.OLLAMA_URL || "http://localhost:11434/api/generate",
};
