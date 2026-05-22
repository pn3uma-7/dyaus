const { Pool, types } = require('pg');
const config = require('../config');

// Return BIGINT (OID 20) as JS number — credit_balance never exceeds Number.MAX_SAFE_INTEGER
types.setTypeParser(20, (val) => parseInt(val, 10));

const pool = new Pool(config.pg);

// ── Auth path ─────────────────────────────────────────────────────────────────

async function getKeyByHash(keyHash) {
  const result = await pool.query(
    `SELECT k.id, k.user_id, k.is_active, k.rate_limit_rpm, u.credit_balance
     FROM api_keys k
     JOIN users u ON u.id = k.user_id
     WHERE k.key_hash = $1`,
    [keyHash]
  );
  return result.rows[0] || null;
}

// ── Post-request accounting ───────────────────────────────────────────────────

async function deductCredits(userId, amount) {
  await pool.query(
    `UPDATE users SET credit_balance = credit_balance - $1 WHERE id = $2`,
    [amount, userId]
  );
}

async function updateLastUsed(keyId) {
  await pool.query(
    `UPDATE api_keys SET last_used_at = NOW() WHERE id = $1`,
    [keyId]
  );
}

async function logUsage({ userId, keyId, model, inputTokens, outputTokens, creditsDeducted, durationMs }) {
  await pool.query(
    `INSERT INTO usage_log (user_id, key_id, model, input_tokens, output_tokens, credits_deducted, duration_ms)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [userId, keyId, model, inputTokens, outputTokens, creditsDeducted, durationMs]
  );
}

// ── User dashboard ────────────────────────────────────────────────────────────

async function getUserById(userId) {
  const result = await pool.query(
    `SELECT id, email, name, credit_balance, created_at FROM users WHERE id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

async function getUserByEmail(email) {
  const result = await pool.query(
    `SELECT id, email, name, credit_balance, created_at FROM users WHERE email = $1`,
    [email.toLowerCase()]
  );
  return result.rows[0] || null;
}

async function getKeysByUserId(userId) {
  const result = await pool.query(
    `SELECT id, key_prefix, label, model_access, rate_limit_rpm, is_active, created_at, last_used_at
     FROM api_keys
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

async function createKey({ userId, keyHash, keyPrefix, label, rateLimitRpm, modelAccess }) {
  const result = await pool.query(
    `INSERT INTO api_keys (user_id, key_hash, key_prefix, label, rate_limit_rpm, model_access)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, key_prefix, label, model_access, rate_limit_rpm, is_active, created_at`,
    [userId, keyHash, keyPrefix, label || null, rateLimitRpm || 10, modelAccess || ['qwen3-30b']]
  );
  return result.rows[0];
}

async function deactivateKey(keyId, userId = null) {
  const result = await pool.query(
    `UPDATE api_keys SET is_active = FALSE
     WHERE id = $1 AND ($2::uuid IS NULL OR user_id = $2)
     RETURNING id`,
    [keyId, userId]
  );
  return result.rows[0] || null;
}

async function getUsageByUser(userId, limit = 50, offset = 0) {
  const result = await pool.query(
    `SELECT model, input_tokens, output_tokens, credits_deducted, duration_ms, created_at,
            k.key_prefix
     FROM usage_log u
     JOIN api_keys k ON k.id = u.key_id
     WHERE u.user_id = $1
     ORDER BY u.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return result.rows;
}

// ── Admin ─────────────────────────────────────────────────────────────────────

async function listUsers() {
  const result = await pool.query(
    `SELECT u.id, u.email, u.name, u.credit_balance, u.created_at,
            COUNT(k.id) FILTER (WHERE k.is_active) AS active_keys
     FROM users u
     LEFT JOIN api_keys k ON k.user_id = u.id
     GROUP BY u.id
     ORDER BY u.created_at DESC`
  );
  return result.rows;
}

async function createUser({ email, name }) {
  const result = await pool.query(
    `INSERT INTO users (email, name) VALUES ($1, $2)
     RETURNING id, email, name, credit_balance, created_at`,
    [email, name || null]
  );
  return result.rows[0];
}

async function adjustCredits(userId, amount) {
  const result = await pool.query(
    `UPDATE users SET credit_balance = credit_balance + $1
     WHERE id = $2
     RETURNING id, email, credit_balance`,
    [amount, userId]
  );
  return result.rows[0] || null;
}

async function getStats() {
  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM users)::int                                    AS total_users,
      (SELECT COUNT(*) FROM api_keys WHERE is_active)::int                 AS active_keys,
      (SELECT COUNT(*) FROM usage_log)::int                                AS total_requests,
      (SELECT COALESCE(SUM(credits_deducted), 0) FROM usage_log)::int     AS total_credits_used,
      (SELECT COUNT(*) FROM usage_log
       WHERE created_at >= NOW() - INTERVAL '24 hours')::int              AS requests_today
  `);
  return result.rows[0];
}

module.exports = {
  pool,
  getKeyByHash, deductCredits, updateLastUsed, logUsage,
  getUserById, getUserByEmail, getKeysByUserId, createKey, deactivateKey, getUsageByUser,
  listUsers, createUser, adjustCredits, getStats,
};
