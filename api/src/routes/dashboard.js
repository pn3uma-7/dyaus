const crypto = require('crypto');
const express = require('express');
const { sessionAuth } = require('../middleware/sessionAuth');
const {
  getUserById, getKeysByUserId, createKey, deactivateKey, getUsageByUser,
} = require('../services/postgres');
const config = require('../config');

const router = express.Router();

router.use(sessionAuth);

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
  const rows = await getUsageByUser(req.session.userId, limit, offset).catch(() => []);
  res.json(rows);
});

module.exports = router;
