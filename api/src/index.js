const express = require('express');
const config = require('./config');
const { pool } = require('./services/postgres');
const { redisClient } = require('./services/redis');
const { close: closeQueue } = require('./services/queue');
const chatRouter = require('./routes/chat');
const healthRouter = require('./routes/health');
const authRouter = require('./routes/authRoutes');
const dashboardRouter = require('./routes/dashboard');
const adminRouter = require('./routes/admin');

const app = express();
app.use(express.json());

app.use('/v1/chat', chatRouter);
app.use('/auth', authRouter);
app.use('/dashboard', dashboardRouter);
app.use('/admin', adminRouter);
app.use('/', healthRouter);

app.listen(config.port, () => {
  console.log(`Dyaus API running on port ${config.port}`);
});

process.on('SIGTERM', async () => {
  await Promise.allSettled([pool.end(), redisClient.quit(), closeQueue()]);
  process.exit(0);
});
