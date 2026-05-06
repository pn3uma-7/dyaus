require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  pg: {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT) || 5432,
    database: process.env.PG_DB || 'inference_platform',
    user: process.env.PG_USER || 'platform_user',
    password: process.env.PG_PASSWORD,
  },

  ollama: {
    host: process.env.OLLAMA_HOST || 'http://localhost:11434',
    defaultModel: process.env.OLLAMA_DEFAULT_MODEL || 'qwen2.5:7b',
  },

  credits: {
    default: parseInt(process.env.DEFAULT_CREDITS) || 100,
    outputTokenMultiplier: parseInt(process.env.OUTPUT_TOKEN_MULTIPLIER) || 2,
  },

  apiKeyPrefix: process.env.API_KEY_PREFIX || 'sk-',
  adminSecret: process.env.ADMIN_SECRET,
};
