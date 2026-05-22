require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  pg: {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT) || 5432,
    database: process.env.PG_DB || 'dyaus',
    user: process.env.PG_USER || 'dyaus_user',
    password: process.env.PG_PASSWORD,
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },

  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost',
  },

  inference: {
    base: process.env.INFERENCE_BASE || 'http://localhost:8080',
    defaultModel: process.env.DEFAULT_MODEL || 'qwen3-30b',
  },

  outputTokenMultiplier: parseInt(process.env.OUTPUT_TOKEN_MULTIPLIER) || 2,
  apiKeyPrefix: process.env.API_KEY_PREFIX || 'sk-dyaus-',
  adminSecret: process.env.ADMIN_SECRET,
  keyCacheTtlSeconds: 60,
};
