const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool(config.pg);

async function getKeyByHash(keyHash) {
  const result = await pool.query(
    `SELECT id, user_id, credits, is_active
     FROM api_keys
     WHERE key_hash = $1`,
    [keyHash]
  );
  return result.rows[0] || null;
}

async function deductCredits(keyId, amount) {
  await pool.query(
    `UPDATE api_keys
     SET credits = credits - $1, last_used_at = NOW()
     WHERE id = $2`,
    [amount, keyId]
  );
}

async function logUsage({ keyId, model, inputTokens, outputTokens, creditsDeducted, latencyMs }) {
  await pool.query(
    `INSERT INTO usage_log (api_key_id, model, input_tokens, output_tokens, credits_deducted, latency_ms)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [keyId, model, inputTokens, outputTokens, creditsDeducted, latencyMs]
  );
}

module.exports = { pool, getKeyByHash, deductCredits, logUsage };
