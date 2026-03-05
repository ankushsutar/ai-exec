const fs = require("fs");
const path = require("path");

const METRICS_FILE = path.join(
  __dirname,
  "../../storage/performance_metrics.json",
);

/**
 * Service to track and persist AI performance metrics.
 */
class ProfilerService {
  constructor() {
    this.ensureStorage();
  }

  ensureStorage() {
    const storageDir = path.dirname(METRICS_FILE);
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    if (!fs.existsSync(METRICS_FILE)) {
      fs.writeFileSync(METRICS_FILE, JSON.stringify([], null, 2));
    }
  }

  /**
   * Logs a query execution profile.
   * @param {Object} profile - { requestId, question, intent, duration, success, engine, error }
   */
  logProfile(profile) {
    try {
      const metrics = JSON.parse(fs.readFileSync(METRICS_FILE, "utf8"));

      const entry = {
        timestamp: new Date().toISOString(),
        ...profile,
      };

      metrics.push(entry);

      // Keep only last 1000 entries to prevent file bloat
      if (metrics.length > 1000) {
        metrics.shift();
      }

      fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2));
      console.log(
        `[Profiler] Logged trace for #${profile.requestId} (${profile.duration}ms)`,
      );
    } catch (e) {
      console.warn("[Profiler] Failed to log metric:", e.message);
    }
  }

  /**
   * Returns summary statistics for the dashboard.
   */
  getStatsSummary() {
    try {
      const metrics = JSON.parse(fs.readFileSync(METRICS_FILE, "utf8"));
      if (metrics.length === 0) return null;

      const totalRequests = metrics.length;
      const successfulRequests = metrics.filter((m) => m.success).length;
      const totalDuration = metrics.reduce(
        (acc, m) => acc + (m.duration || 0),
        0,
      );

      return {
        totalRequests,
        successRate:
          ((successfulRequests / totalRequests) * 100).toFixed(2) + "%",
        avgLatency: (totalDuration / totalRequests).toFixed(2) + "ms",
        recentLogs: metrics.slice(-5),
      };
    } catch (e) {
      return null;
    }
  }
}

module.exports = new ProfilerService();
