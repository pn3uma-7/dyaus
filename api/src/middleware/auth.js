const crypto = require('crypto');
const { getKeyByHash } = require('../services/postgres');
const config = require('../config');

function hashKey(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

async function auth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  const rawKey = authHeader.slice(7);
  if (!rawKey.startsWith(config.apiKeyPrefix)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  const keyHash = hashKey(rawKey);
  const record = await getKeyByHash(keyHash).catch(() => null);

  if (!record || !record.is_active) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  if (record.credit_balance <= 0) {
    return res.status(402).json({ error: 'Insufficient credits' });
  }

  req.keyRecord = record;
  next();
}

module.exports = { auth };
