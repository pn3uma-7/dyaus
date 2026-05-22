const Redis = require('ioredis');
const config = require('../config');

const redisClient = new Redis(config.redis);

redisClient.on('error', (err) => console.error('Redis client error:', err));

async function cacheKey(keyHash, record) {
  await redisClient.setex(
    `cache:key:${keyHash}`,
    config.keyCacheTtlSeconds,
    JSON.stringify(record)
  );
}

async function getCachedKey(keyHash) {
  const raw = await redisClient.get(`cache:key:${keyHash}`);
  return raw ? JSON.parse(raw) : null;
}

async function invalidateCachedKey(keyHash) {
  await redisClient.del(`cache:key:${keyHash}`);
}

async function publish(channel, data) {
  await redisClient.publish(channel, JSON.stringify(data));
}

// Returns a fresh Redis connection in subscriber mode.
// Each streaming request gets its own subscriber — ioredis in
// subscribe mode cannot issue other commands.
function createSubscriber() {
  const sub = redisClient.duplicate();
  sub.on('error', (err) => console.error('Redis subscriber error:', err));
  return sub;
}

module.exports = { redisClient, cacheKey, getCachedKey, invalidateCachedKey, publish, createSubscriber };
