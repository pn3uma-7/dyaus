const { redisClient } = require('../services/redis');

async function rateLimit(req, res, next) {
  const { keyRecord } = req;
  const rpm = keyRecord.rate_limit_rpm;
  if (!rpm) return next();

  const minute = Math.floor(Date.now() / 60000);
  const key = `rl:${keyRecord.id}:${minute}`;

  const count = await redisClient.incr(key);
  if (count === 1) {
    await redisClient.expire(key, 60);
  }

  if (count > rpm) {
    const retryAfter = Math.ceil(60 - (Date.now() / 1000) % 60);
    return res.status(429).json({ error: 'Rate limit exceeded', retry_after: retryAfter });
  }

  next();
}

module.exports = { rateLimit };
