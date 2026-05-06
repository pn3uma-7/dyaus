const express = require('express');
const { isAvailable } = require('../services/ollama');
const config = require('../config');

const router = express.Router();

router.get('/health', async (req, res) => {
  const gpu = await isAvailable();
  res.json({
    status: 'ok',
    model: config.ollama.defaultModel,
    gpu: gpu ? 'available' : 'unavailable',
  });
});

module.exports = router;
