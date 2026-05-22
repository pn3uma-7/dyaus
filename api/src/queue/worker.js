require('dotenv').config();

const { Readable } = require('stream');
const { getChannel, close: closeQueue, QUEUE_NAME } = require('../services/queue');
const { publish, redisClient } = require('../services/redis');
const { deductCredits, updateLastUsed, logUsage } = require('../services/postgres');
const { chatCompletion, chatStream } = require('../services/inference');
const { extractUsage } = require('../services/tokenCounter');
const { calculateCredits } = require('../services/credits');
const config = require('../config');

async function handleJob({ jobId, body, keyRecord }) {
  const redisChannel = `job:${jobId}`;
  const start = Date.now();
  const model = body.model || config.inference.defaultModel;
  const isStream = !!body.stream;

  try {
    if (isStream) {
      await handleStream(body, redisChannel, start, model, keyRecord);
    } else {
      await handleNonStream(body, redisChannel, start, model, keyRecord);
    }
  } catch (err) {
    console.error(`Job ${jobId} error:`, err.message);
    await publish(redisChannel, { type: 'error', message: 'Inference failed' }).catch(() => {});
  }
}

async function handleNonStream(body, redisChannel, start, model, keyRecord) {
  const result = await chatCompletion(body);
  const durationMs = Date.now() - start;
  const { inputTokens, outputTokens } = extractUsage(result);
  const creditsDeducted = calculateCredits(inputTokens, outputTokens);

  await publish(redisChannel, { type: 'result', data: result });

  doAccounting(keyRecord, model, inputTokens, outputTokens, creditsDeducted, durationMs);
}

async function handleStream(body, redisChannel, start, model, keyRecord) {
  const response = await chatStream(body);
  const nodeStream = Readable.fromWeb(response.body);

  let buffer = '';
  let usage = null;

  for await (const rawChunk of nodeStream) {
    buffer += rawChunk.toString('utf8');
    const lines = buffer.split('\n');
    buffer = lines.pop(); // hold the last (possibly incomplete) line

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;

      const data = trimmed.slice(6);
      if (data === '[DONE]') continue; // API sends its own [DONE]

      // Publish raw SSE line to the API process
      await publish(redisChannel, { type: 'chunk', line: trimmed });

      // Capture usage when present (comes in the final content chunk)
      try {
        const parsed = JSON.parse(data);
        if (parsed.usage) usage = parsed.usage;
      } catch {} // non-JSON, skip
    }
  }

  // Flush any remaining buffer content
  if (buffer.trim().startsWith('data: ')) {
    const data = buffer.trim().slice(6);
    if (data !== '[DONE]') {
      await publish(redisChannel, { type: 'chunk', line: buffer.trim() });
      try {
        const parsed = JSON.parse(data);
        if (parsed.usage) usage = parsed.usage;
      } catch {}
    }
  }

  const durationMs = Date.now() - start;
  const inputTokens = usage?.prompt_tokens ?? 0;
  const outputTokens = usage?.completion_tokens ?? 0;
  const creditsDeducted = calculateCredits(inputTokens, outputTokens);

  await publish(redisChannel, { type: 'done' });

  doAccounting(keyRecord, model, inputTokens, outputTokens, creditsDeducted, durationMs);
}

function doAccounting(keyRecord, model, inputTokens, outputTokens, creditsDeducted, durationMs) {
  Promise.all([
    deductCredits(keyRecord.user_id, creditsDeducted),
    updateLastUsed(keyRecord.id),
    logUsage({
      userId: keyRecord.user_id,
      keyId: keyRecord.id,
      model,
      inputTokens,
      outputTokens,
      creditsDeducted,
      durationMs,
    }),
  ]).catch((err) => console.error('Worker accounting error:', err));
}

async function start() {
  console.log('Dyaus worker starting...');
  const ch = await getChannel();

  // Process one job at a time — llama-server manages its own parallel slots
  ch.prefetch(1);

  ch.consume(QUEUE_NAME, async (msg) => {
    if (!msg) return;

    let jobData;
    try {
      jobData = JSON.parse(msg.content.toString());
    } catch {
      ch.ack(msg);
      return;
    }

    try {
      await handleJob(jobData);
    } finally {
      ch.ack(msg);
    }
  });

  console.log(`Worker ready — consuming from "${QUEUE_NAME}"`);
}

async function shutdown() {
  await closeQueue();
  await redisClient.quit();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start().catch((err) => {
  console.error('Worker startup failed:', err);
  process.exit(1);
});
