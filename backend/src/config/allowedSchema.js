/**
 * SCHEMA WHITELIST
 * ─────────────────────────────────────────────────────────────────────────────
 * Only the tables/collections listed here will be embedded into the vector
 * store and injected into LLM prompts.
 *
 * Purpose: Reduce noise and prevent the AI from generating queries against
 * irrelevant system/migration tables.
 *
 * ⚠  After changing this file you MUST delete:
 *     backend/storage/knowledge_embeddings.json
 * and restart the server so the embeddings are rebuilt.
 */

const ALLOWED_POSTGRES_TABLES = [
  "userInfo",
  "userGroupInfo",
  "merchantInfo",
  "merchantRelationInfo",
  "MerchantDeviceRelationInfo",
  "deviceBriefInfo",
  "deviceIdentInfo",
  "deviceRelationInfo",
  "groupInfo",
  "groupHierarchyInfo",
];

const ALLOWED_MONGO_COLLECTIONS = [
  "systemDailySummaryInfo",
  "systemSummaryInfo",
  "transactionActionHistoryInfo",
  "userSummaryInfo",
  "deviceStatHistoryInfo",
  "deviceModeHistoryInfo",
  "deviceNetworkInfo",
  "deviceEventLogHistoryInfo",
  "deviceConnectivityMonthlyInfo",
  "deviceConnectivityMonthlyHistoryInfo",
  "deviceConnectivityHistoryInfo",
  "deviceConfigHistoryInfo",
  "advertisementActionHistoryInfo",
];

module.exports = { ALLOWED_POSTGRES_TABLES, ALLOWED_MONGO_COLLECTIONS };
