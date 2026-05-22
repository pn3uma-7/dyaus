const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const { redisClient } = require('./redis');
const config = require('../config');

const resend = new Resend(config.resend.apiKey);

function issueJwt(userId, email) {
  return jwt.sign({ userId, email }, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn,
  });
}

function verifyJwt(token) {
  return jwt.verify(token, config.auth.jwtSecret);
}

async function createMagicToken(userId) {
  const token = crypto.randomUUID();
  await redisClient.setex(`magic:${token}`, config.auth.magicLinkTtlSeconds, userId);
  return token;
}

async function consumeMagicToken(token) {
  const key = `magic:${token}`;
  const userId = await redisClient.get(key);
  if (!userId) return null;
  await redisClient.del(key); // one-time use
  return userId;
}

async function sendMagicLinkEmail(email, magicUrl) {
  await resend.emails.send({
    from: config.resend.from,
    to: email,
    subject: 'Sign in to Dyaus',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="margin:0 0 8px">Sign in to Dyaus</h2>
        <p style="color:#666;margin:0 0 24px">Click the button below to sign in. This link expires in 15 minutes.</p>
        <a href="${magicUrl}"
           style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600">
          Sign in
        </a>
        <p style="color:#999;font-size:12px;margin:24px 0 0">
          If you didn't request this, ignore this email.
        </p>
      </div>
    `,
  });
}

module.exports = { issueJwt, verifyJwt, createMagicToken, consumeMagicToken, sendMagicLinkEmail };
