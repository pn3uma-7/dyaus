const config = require('../config');

function calculateCredits(inputTokens, outputTokens) {
  return inputTokens + outputTokens * config.outputTokenMultiplier;
}

module.exports = { calculateCredits };
