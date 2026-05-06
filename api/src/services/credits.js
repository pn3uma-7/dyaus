const config = require('../config');

function calculateCredits(inputTokens, outputTokens) {
  return inputTokens + outputTokens * config.credits.outputTokenMultiplier;
}

module.exports = { calculateCredits };
