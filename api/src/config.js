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

  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: '30d',
    magicLinkTtlSeconds: 900, // 15 minutes
  },

  resend: {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.RESEND_FROM || 'noreply@ameytambe.rocks',
  },

  dashboardUrl: process.env.DASHBOARD_URL || 'http://localhost:3000',
  freeCreditsOnSignup: parseInt(process.env.FREE_CREDITS_ON_SIGNUP) || 10000,

  outputTokenMultiplier: parseInt(process.env.OUTPUT_TOKEN_MULTIPLIER) || 2,
  apiKeyPrefix: process.env.API_KEY_PREFIX || 'sk-dyaus-',
  adminSecret: process.env.ADMIN_SECRET,
  keyCacheTtlSeconds: 60,

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
  },

  creditPacks: {
    starter: { name: 'Starter', amountPaise: 4900,  credits: 50000 },
    growth:  { name: 'Growth',  amountPaise: 14900, credits: 200000 },
    pro:     { name: 'Pro',     amountPaise: 49900, credits: 750000 },
    power:   { name: 'Power',   amountPaise: 99900, credits: 1800000 },
  },
};
