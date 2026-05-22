const express = require('express');
const { getUserByEmail, getUserById, createUser } = require('../services/postgres');
const { createMagicToken, consumeMagicToken, sendMagicLinkEmail, issueJwt } = require('../services/authService');
const config = require('../config');

const router = express.Router();

// POST /auth/magic-link
// Body: { email }
// Always responds with 200 — never reveals whether the email exists
router.post('/magic-link', async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'email required' });

  let user = await getUserByEmail(email).catch(() => null);

  if (!user) {
    // First time — auto-register with free credits
    user = await createUser({ email, initialCredits: config.freeCreditsOnSignup }).catch(() => null);
  }

  if (user && user.is_active !== false) {
    try {
      const token = await createMagicToken(user.id);
      const magicUrl = `${config.dashboardUrl}/auth/verify?token=${token}`;
      await sendMagicLinkEmail(email, magicUrl);
    } catch (err) {
      console.error('Magic link send error:', err.message);
    }
  }

  // Always return 200 — don't leak registration status
  res.json({ ok: true });
});

// POST /auth/verify
// Body: { token }
// Returns: { jwt, user: { id, email, name, credit_balance } }
router.post('/verify', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'token required' });

  const userId = await consumeMagicToken(token).catch(() => null);
  if (!userId) return res.status(401).json({ error: 'Invalid or expired link' });

  const user = await getUserById(userId).catch(() => null);
  if (!user) return res.status(401).json({ error: 'User not found' });

  const jwtToken = issueJwt(user.id, user.email);
  res.json({ jwt: jwtToken, user });
});

module.exports = router;
