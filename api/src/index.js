const express = require('express');
const config = require('./config');
const { pool } = require('./services/postgres');
const { redisClient } = require('./services/redis');
const { close: closeQueue } = require('./services/queue');
const chatRouter = require('./routes/chat');
const healthRouter = require('./routes/health');

const app = express();
app.use(express.json());

app.use('/v1/chat', chatRouter);
app.use('/', healthRouter);

app.listen(config.port, () => {
  console.log(`Dyaus API running on port ${config.port}`);
});

process.on('SIGTERM', async () => {
  await Promise.allSettled([pool.end(), redisClient.quit(), closeQueue()]);
  process.exit(0);
});
