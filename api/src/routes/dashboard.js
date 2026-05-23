const crypto = require('crypto');
const { Readable } = require('stream');
const express = require('express');
const { sessionAuth } = require('../middleware/sessionAuth');
const { chatStream } = require('../services/inference');
const {
  getUserById, getKeysByUserId, createKey, deactivateKey, getUsageByUser, getSetting,
} = require('../services/postgres');
const config = require('../config');

const router = express.Router();

router.use(sessionAuth);

// GET /dashboard/settings — returns non-sensitive platform flags
router.get('/settings', async (req, res) => {
  const paymentsEnabled = await getSetting('payments_enabled').catch(() => 'true');
  res.json({ payments_enabled: paymentsEnabled === 'true' });
});

// GET /dashboard/me
router.get('/me', async (req, res) => {
  const user = await getUserById(req.session.userId).catch(() => null);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// GET /dashboard/me/keys
router.get('/me/keys', async (req, res) => {
  const keys = await getKeysByUserId(req.session.userId).catch(() => []);
  res.json(keys);
});

// POST /dashboard/me/keys
router.post('/me/keys', async (req, res) => {
  const { label, rate_limit_rpm } = req.body;
  const rawKey = config.apiKeyPrefix + crypto.randomBytes(20).toString('hex');
  const keyPrefix = rawKey.slice(0, 12);
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  const key = await createKey({
    userId: req.session.userId,
    keyHash,
    keyPrefix,
    label,
    rateLimitRpm: rate_limit_rpm,
  }).catch(() => null);

  if (!key) return res.status(500).json({ error: 'Failed to create key' });
  res.status(201).json({ ...key, raw_key: rawKey });
});

// DELETE /dashboard/me/keys/:id
router.delete('/me/keys/:id', async (req, res) => {
  const result = await deactivateKey(req.params.id, req.session.userId).catch(() => null);
  if (!result) return res.status(404).json({ error: 'Key not found' });
  res.json({ ok: true });
});

// GET /dashboard/me/usage
router.get('/me/usage', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;
  try {
    const rows = await getUsageByUser(req.session.userId, limit, offset);
    res.json(rows);
  } catch (err) {
    console.error('Usage query error for userId', req.session.userId, ':', err.message);
    res.json([]);
  }
});

// POST /dashboard/test-chat
// Free streaming chat — no credits charged, max 512 tokens, direct llama-server call
router.post('/test-chat', async (req, res) => {
  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const response = await chatStream({ messages, max_tokens: 512 });
    const nodeStream = Readable.fromWeb(response.body);

    let buffer = '';
    for await (const chunk of nodeStream) {
      buffer += chunk.toString('utf8');
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (line.trim()) res.write(line + '\n');
      }
    }
    if (buffer.trim()) res.write(buffer + '\n');
    res.write('\n');
  } catch (err) {
    res.write('data: {"error":"Inference unavailable"}\n\n');
  }

  res.end();
});

module.exports = router;
