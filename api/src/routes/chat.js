const crypto = require('crypto');
const express = require('express');
const { auth } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');
const { pushJob } = require('../queue/producer');
const { createSubscriber } = require('../services/redis');
const config = require('../config');

const router = express.Router();

const JOB_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes — covers long generations

router.post('/completions', auth, rateLimit, async (req, res) => {
  const { keyRecord } = req;
  const model = req.body.model || config.inference.defaultModel;
  const isStream = !!req.body.stream;
  const jobId = crypto.randomUUID();
  const redisChannel = `job:${jobId}`;

  // Subscribe BEFORE enqueuing to avoid a race where the worker
  // publishes before the API is listening.
  const sub = createSubscriber();
  try {
    await sub.subscribe(redisChannel);
  } catch {
    return res.status(503).json({ error: 'Service temporarily unavailable' });
  }

  try {
    await pushJob(jobId, req.body, keyRecord);
  } catch {
    sub.disconnect();
    return res.status(503).json({ error: 'Service temporarily unavailable' });
  }

  if (isStream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let done = false;
    const cleanup = () => {
      if (done) return;
      done = true;
      clearTimeout(timeoutId);
      sub.unsubscribe(redisChannel).catch(() => {});
      sub.disconnect();
    };

    const timeoutId = setTimeout(() => {
      cleanup();
      res.write('data: [DONE]\n\n');
      res.end();
    }, JOB_TIMEOUT_MS);

    sub.on('message', (_ch, rawMsg) => {
      const msg = JSON.parse(rawMsg);
      if (msg.type === 'chunk') {
        res.write(`${msg.line}\n\n`);
      } else if (msg.type === 'searching') {
        res.write(`data: {"id":"dyaus-status","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"content":""},"finish_reason":null}],"dyaus_status":"searching"}\n\n`);
      } else if (msg.type === 'done') {
        cleanup();
        res.write('data: [DONE]\n\n');
        res.end();
      } else if (msg.type === 'error') {
        cleanup();
        res.write(`data: {"error":${JSON.stringify(msg.message)}}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      }
    });

    req.on('close', cleanup);

  } else {
    const timeoutId = setTimeout(() => {
      sub.disconnect();
      if (!res.headersSent) {
        res.status(504).json({ error: 'Request timeout' });
      }
    }, JOB_TIMEOUT_MS);

    sub.on('message', (_ch, rawMsg) => {
      clearTimeout(timeoutId);
      sub.disconnect();
      const msg = JSON.parse(rawMsg);
      if (msg.type === 'result') {
        res.json({ ...msg.data, model });
      } else if (msg.type === 'error') {
        res.status(502).json({ error: msg.message });
      }
    });
  }
});

module.exports = router;
