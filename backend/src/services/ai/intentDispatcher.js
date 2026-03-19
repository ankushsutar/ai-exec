const { dispatchAction } = require("./actionDispatcher");

/**
 * Uses the Unified Action Dispatcher (V3 backward compatibility).
 */
async function dispatchIntent(question) {
  const actionResult = await dispatchAction(question);
  return actionResult;
}

module.exports = { dispatchIntent };
