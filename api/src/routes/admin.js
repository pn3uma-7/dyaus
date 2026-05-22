const crypto = require('crypto');
const express = require('express');
const { listUsers, createUser, adjustCredits, getStats, createKey, deactivateKey } = require('../services/postgres');
const config = require('../config');

const router = express.Router();

function adminAuth(req, res, next) {
  const secret = req.headers['x-admin-secret'];
  if (!secret || secret !== config.adminSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.use(adminAuth);

// GET /admin/stats
router.get('/stats', async (req, res) => {
  const stats = await getStats().catch(() => null);
  if (!stats) return res.status(500).json({ error: 'Failed to load stats' });
  res.json(stats);
});

// GET /admin/users
router.get('/users', async (req, res) => {
  const users = await listUsers().catch(() => []);
  res.json(users);
});

// POST /admin/users — create a user
router.post('/users', async (req, res) => {
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });
  const user = await createUser({ email, name }).catch(() => null);
  if (!user) return res.status(409).json({ error: 'Email already exists' });
  res.status(201).json(user);
});

// PATCH /admin/users/:id/credits — adjust credit balance (positive or negative)
router.patch('/users/:id/credits', async (req, res) => {
  const amount = parseInt(req.body.amount);
  if (!amount || isNaN(amount)) return res.status(400).json({ error: 'amount required' });
  const user = await adjustCredits(req.params.id, amount).catch(() => null);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// POST /admin/users/:id/keys — create a key for a user
router.post('/users/:id/keys', async (req, res) => {
  const { label, rate_limit_rpm, model_access } = req.body;
  const rawKey = config.apiKeyPrefix + crypto.randomBytes(20).toString('hex');
  const keyPrefix = rawKey.slice(0, 12);
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  const key = await createKey({
    userId: req.params.id,
    keyHash,
    keyPrefix,
    label,
    rateLimitRpm: rate_limit_rpm,
    modelAccess: model_access,
  }).catch(() => null);

  if (!key) return res.status(500).json({ error: 'Failed to create key' });
  res.status(201).json({ ...key, raw_key: rawKey });
});

// DELETE /admin/keys/:id — deactivate any key
router.delete('/keys/:id', async (req, res) => {
  // Admin can deactivate any key — pass null userId to skip ownership check
  await deactivateKey(req.params.id, req.query.user_id).catch(() => {});
  res.json({ ok: true });
});

module.exports = router;
