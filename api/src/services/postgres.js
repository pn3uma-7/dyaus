const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool(config.pg);

async function getKeyByHash(keyHash) {
  const result = await pool.query(
    `SELECT k.id, k.user_id, k.is_active, u.credit_balance
     FROM api_keys k
     JOIN users u ON u.id = k.user_id
     WHERE k.key_hash = $1`,
    [keyHash]
  );
  return result.rows[0] || null;
}

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

module.exports = { pool, getKeyByHash, deductCredits, updateLastUsed, logUsage };
