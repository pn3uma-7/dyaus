const express = require('express');
const { auth } = require('../middleware/auth');
const { chatCompletion } = require('../services/ollama');
const { deductCredits, logUsage } = require('../services/postgres');
const { extractUsage } = require('../services/tokenCounter');
const { calculateCredits } = require('../services/credits');
const config = require('../config');

const router = express.Router();

router.post('/completions', auth, async (req, res) => {
  const { keyRecord } = req;
  const start = Date.now();

  let ollamaResponse;
  try {
    ollamaResponse = await chatCompletion(req.body);
  } catch (err) {
    const status = err.status === 404 ? 503 : 502;
    return res.status(status).json({ error: 'Model not available' });
  }

  const latencyMs = Date.now() - start;
  const { inputTokens, outputTokens } = extractUsage(ollamaResponse);
  const creditsDeducted = calculateCredits(inputTokens, outputTokens);
  const model = req.body.model || config.ollama.defaultModel;

  await Promise.all([
    deductCredits(keyRecord.id, creditsDeducted),
    logUsage({ keyId: keyRecord.id, model, inputTokens, outputTokens, creditsDeducted, latencyMs }),
  ]);

  res.json(ollamaResponse);
});

module.exports = router;
