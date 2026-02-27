const fs = require("fs");
const path = require("path");
const DATASET_FILE = path.join(__dirname, "../config/dataset_log.json");

/**
 * Logs a production query and its outcome for future training.
 */
function logProductionQuery(question, intent, metadata = {}) {
  try {
    const entry = {
      timestamp: new Date().toISOString(),
      question,
      intent,
      ...metadata,
    };

    let dataset = [];
    if (fs.existsSync(DATASET_FILE)) {
      dataset = JSON.parse(fs.readFileSync(DATASET_FILE, "utf8"));
    }

    dataset.push(entry);

    // Limit log size to prevent infinite growth
    if (dataset.length > 1000) dataset.shift();

    fs.writeFileSync(DATASET_FILE, JSON.stringify(dataset, null, 2));
  } catch (error) {
    console.error(
      "[Dataset Service] Failed to log production query:",
      error.message,
    );
  }
}

/**
 * Returns the collected dataset for cleaning/structuring.
 */
function getDataset() {
  try {
    if (fs.existsSync(DATASET_FILE)) {
      return JSON.parse(fs.readFileSync(DATASET_FILE, "utf8"));
    }
  } catch (e) {}
  return [];
}

module.exports = { logProductionQuery, getDataset };
