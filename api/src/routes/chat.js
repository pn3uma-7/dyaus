const express = require('express');
const { auth } = require('../middleware/auth');
const { chatCompletion } = require('../services/inference');
const { deductCredits, updateLastUsed, logUsage } = require('../services/postgres');
const { extractUsage } = require('../services/tokenCounter');
const { calculateCredits } = require('../services/credits');
const config = require('../config');

const router = express.Router();

router.post('/completions', auth, async (req, res) => {
  const { keyRecord } = req;
  const start = Date.now();
  const model = req.body.model || config.inference.defaultModel;

  let inferenceResponse;
  try {
    inferenceResponse = await chatCompletion(req.body);
  } catch (err) {
    const status = err.status === 404 ? 503 : 502;
    return res.status(status).json({ error: 'Model not available' });
  }

  const durationMs = Date.now() - start;
  const { inputTokens, outputTokens } = extractUsage(inferenceResponse);
  const creditsDeducted = calculateCredits(inputTokens, outputTokens);

  // Return response immediately, deduct and log async
  res.json({ ...inferenceResponse, model });

  Promise.all([
    deductCredits(keyRecord.user_id, creditsDeducted),
    updateLastUsed(keyRecord.id),
    logUsage({
      userId: keyRecord.user_id,
      keyId: keyRecord.id,
      model,
      inputTokens,
      outputTokens,
      creditsDeducted,
      durationMs,
    }),
  ]).catch(err => console.error('Post-request accounting error:', err));
});

module.exports = router;
