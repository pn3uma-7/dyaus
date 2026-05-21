const express = require('express');
const { isAvailable } = require('../services/inference');
const config = require('../config');

const router = express.Router();

router.get('/health', async (req, res) => {
  const gpu = await isAvailable();
  res.json({
    status: 'ok',
    model: config.inference.defaultModel,
    gpu: gpu ? 'available' : 'unavailable',
  });
});

module.exports = router;
