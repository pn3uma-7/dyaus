const crypto = require('crypto');
const express = require('express');
const { listUsers, createUser, adjustCredits, getStats, getBillingStats, getAllSettings, setSetting, createKey, deactivateKey, disableUser, enableUser, hardDeleteUser } = require('../services/postgres');
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

// GET /admin/settings
router.get('/settings', async (req, res) => {
  const settings = await getAllSettings().catch(() => null);
  if (!settings) return res.status(500).json({ error: 'Failed to load settings' });
  res.json(settings);
});

// PATCH /admin/settings/:key
router.patch('/settings/:key', async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  if (value === undefined) return res.status(400).json({ error: 'value required' });
  await setSetting(key, String(value)).catch(() => {});
  res.json({ ok: true, key, value: String(value) });
});

// GET /admin/billing
router.get('/billing', async (req, res) => {
  const billing = await getBillingStats().catch(() => null);
  if (!billing) return res.status(500).json({ error: 'Failed to load billing stats' });
  res.json(billing);
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
  const { label, rate_limit_rpm, model_access, web_search } = req.body;
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
    webSearch: web_search === true || web_search === 'true',
  }).catch(() => null);

  if (!key) return res.status(500).json({ error: 'Failed to create key' });
  res.status(201).json({ ...key, raw_key: rawKey });
});

// DELETE /admin/keys/:id — deactivate any key
router.delete('/keys/:id', async (req, res) => {
  await deactivateKey(req.params.id, req.query.user_id).catch(() => {});
  res.json({ ok: true });
});

// PATCH /admin/users/:id/disable — soft disable (deactivates all keys, blocks magic links)
router.patch('/users/:id/disable', async (req, res) => {
  await disableUser(req.params.id).catch(() => {});
  res.json({ ok: true });
});

// PATCH /admin/users/:id/enable — re-enable a disabled user
router.patch('/users/:id/enable', async (req, res) => {
  await enableUser(req.params.id).catch(() => {});
  res.json({ ok: true });
});

// DELETE /admin/users/:id — hard delete (removes user + keys + usage log)
router.delete('/users/:id', async (req, res) => {
  await hardDeleteUser(req.params.id).catch(() => {});
  res.json({ ok: true });
});

module.exports = router;
