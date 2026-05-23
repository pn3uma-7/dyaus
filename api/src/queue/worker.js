require('dotenv').config();

const { Readable } = require('stream');
const { getChannel, close: closeQueue, QUEUE_NAME } = require('../services/queue');
const { publish, redisClient } = require('../services/redis');
const { deductCredits, updateLastUsed, logUsage } = require('../services/postgres');
const { chatCompletion, chatStream } = require('../services/inference');
const { webSearch } = require('../services/webSearch');
const { extractUsage } = require('../services/tokenCounter');
const { calculateCredits } = require('../services/credits');
const config = require('../config');

const WEB_SEARCH_TOOL = {
  type: 'function',
  function: {
    name: 'web_search',
    description:
      'Search the web for current information. Use this when the user asks about recent events, real-time data, or anything that may have changed after your training cutoff.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The search query' },
      },
      required: ['query'],
    },
  },
};

// ── Entry point ───────────────────────────────────────────────────────────────

async function handleJob({ jobId, body, keyRecord }) {
  const redisChannel = `job:${jobId}`;
  const start = Date.now();
  const model = body.model || config.inference.defaultModel;
  const isStream = !!body.stream;
  const canSearch = keyRecord.web_search ?? false;

  try {
    if (canSearch) {
      if (isStream) {
        await handleWithToolsStream(body, redisChannel, start, model, keyRecord);
      } else {
        await handleWithToolsNonStream(body, redisChannel, start, model, keyRecord);
      }
    } else {
      if (isStream) {
        await handleStream(body, redisChannel, start, model, keyRecord);
      } else {
        await handleNonStream(body, redisChannel, start, model, keyRecord);
      }
    }
  } catch (err) {
    console.error(`Job ${jobId} error:`, err.message);
    await publish(redisChannel, { type: 'error', message: 'Inference failed' }).catch(() => {});
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const WEB_SEARCH_SYSTEM =
  'You have access to a web_search tool. Use it whenever the user asks about current events, ' +
  'recent news, real-time data, today\'s date, prices, weather, or anything that may have ' +
  'changed since your training. Always search before saying you don\'t know something current.';

function injectSearchSystem(messages) {
  if (messages[0]?.role === 'system') {
    // Append to existing system message rather than adding a second one
    return [
      { ...messages[0], content: messages[0].content + '\n\n' + WEB_SEARCH_SYSTEM },
      ...messages.slice(1),
    ];
  }
  return [{ role: 'system', content: WEB_SEARCH_SYSTEM }, ...messages];
}

// ── Agentic paths (with tool use) ─────────────────────────────────────────────

async function handleWithToolsNonStream(body, redisChannel, start, model, keyRecord) {
  const messages = injectSearchSystem(body.messages ?? []);
  const firstBody = { ...body, messages, tools: [WEB_SEARCH_TOOL], tool_choice: 'auto', stream: false };
  const firstResult = await chatCompletion(firstBody);

  const choice = firstResult.choices?.[0];
  const toolCalls = choice?.message?.tool_calls;

  if (!toolCalls?.length) {
    // No tool use — return as-is
    const durationMs = Date.now() - start;
    const { inputTokens, outputTokens } = extractUsage(firstResult);
    const creditsDeducted = calculateCredits(inputTokens, outputTokens);
    await publish(redisChannel, { type: 'result', data: firstResult });
    doAccounting(keyRecord, model, inputTokens, outputTokens, creditsDeducted, durationMs);
    return;
  }

  // Execute all tool calls (there will typically be one)
  const toolMessages = await executeToolCalls(toolCalls, redisChannel);

  // Second pass with tool results injected
  const secondBody = {
    ...body,
    stream: false,
    messages: [
      ...messages,
      { role: 'assistant', content: null, tool_calls: toolCalls },
      ...toolMessages,
    ],
  };
  const secondResult = await chatCompletion(secondBody);

  const durationMs = Date.now() - start;
  const usage1 = extractUsage(firstResult);
  const usage2 = extractUsage(secondResult);
  const inputTokens = usage1.inputTokens + usage2.inputTokens;
  const outputTokens = usage1.outputTokens + usage2.outputTokens;
  const creditsDeducted = calculateCredits(inputTokens, outputTokens);

  await publish(redisChannel, { type: 'result', data: secondResult });
  doAccounting(keyRecord, model, inputTokens, outputTokens, creditsDeducted, durationMs);
}

async function handleWithToolsStream(body, redisChannel, start, model, keyRecord) {
  const messages = injectSearchSystem(body.messages ?? []);
  // First pass: non-streaming to detect tool calls cheaply
  const firstBody = { ...body, messages, tools: [WEB_SEARCH_TOOL], tool_choice: 'auto', stream: false };
  const firstResult = await chatCompletion(firstBody);

  const choice = firstResult.choices?.[0];
  const toolCalls = choice?.message?.tool_calls;

  if (!toolCalls?.length) {
    // No tool use — re-run as a proper streaming response so the client gets SSE chunks
    const usage1 = extractUsage(firstResult);
    await handleStream(body, redisChannel, start, model, keyRecord, usage1);
    return;
  }

  const toolMessages = await executeToolCalls(toolCalls, redisChannel);

  const secondBody = {
    ...body,
    stream: true,
    messages: [
      ...messages,
      { role: 'assistant', content: null, tool_calls: toolCalls },
      ...toolMessages,
    ],
  };

  const usage1 = extractUsage(firstResult);
  await handleStream(secondBody, redisChannel, start, model, keyRecord, usage1);
}

// ── Tool execution ────────────────────────────────────────────────────────────

async function executeToolCalls(toolCalls, redisChannel) {
  const messages = [];
  for (const call of toolCalls) {
    if (call.function?.name !== 'web_search') continue;

    let query = '';
    try {
      query = JSON.parse(call.function.arguments).query;
    } catch {
      query = call.function.arguments;
    }

    console.log(`Worker: web_search query="${query}"`);
    await publish(redisChannel, { type: 'searching', query }).catch(() => {});

    const searchResult = await webSearch(query);

    messages.push({
      role: 'tool',
      tool_call_id: call.id,
      content: searchResult,
    });
  }
  return messages;
}

// ── Plain paths (no tools) ────────────────────────────────────────────────────

async function handleNonStream(body, redisChannel, start, model, keyRecord) {
  const result = await chatCompletion(body);
  const durationMs = Date.now() - start;
  const { inputTokens, outputTokens } = extractUsage(result);
  const creditsDeducted = calculateCredits(inputTokens, outputTokens);

  await publish(redisChannel, { type: 'result', data: result });

  doAccounting(keyRecord, model, inputTokens, outputTokens, creditsDeducted, durationMs);
}

// extraUsage: tokens from a prior non-stream pass to add to the tally
async function handleStream(body, redisChannel, start, model, keyRecord, extraUsage = null) {
  const response = await chatStream(body);
  const nodeStream = Readable.fromWeb(response.body);

  let buffer = '';
  let usage = null;

  for await (const rawChunk of nodeStream) {
    buffer += rawChunk.toString('utf8');
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;

      const data = trimmed.slice(6);
      if (data === '[DONE]') continue;

      await publish(redisChannel, { type: 'chunk', line: trimmed });

      try {
        const parsed = JSON.parse(data);
        if (parsed.usage) usage = parsed.usage;
      } catch {}
    }
  }

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
  const streamInputTokens = usage?.prompt_tokens ?? 0;
  const streamOutputTokens = usage?.completion_tokens ?? 0;
  const inputTokens = streamInputTokens + (extraUsage?.inputTokens ?? 0);
  const outputTokens = streamOutputTokens + (extraUsage?.outputTokens ?? 0);
  const creditsDeducted = calculateCredits(inputTokens, outputTokens);

  await publish(redisChannel, { type: 'done' });

  doAccounting(keyRecord, model, inputTokens, outputTokens, creditsDeducted, durationMs);
}

// ── Accounting ────────────────────────────────────────────────────────────────

function doAccounting(keyRecord, model, inputTokens, outputTokens, creditsDeducted, durationMs) {
  deductCredits(keyRecord.user_id, creditsDeducted)
    .catch((err) => console.error('Worker: deductCredits failed:', err.message));
  updateLastUsed(keyRecord.id)
    .catch((err) => console.error('Worker: updateLastUsed failed:', err.message));
  logUsage({ userId: keyRecord.user_id, keyId: keyRecord.id, model, inputTokens, outputTokens, creditsDeducted, durationMs })
    .catch((err) => console.error('Worker: logUsage failed:', err.message));
}

// ── Queue consumer ────────────────────────────────────────────────────────────

async function start() {
  console.log('Dyaus worker starting...');
  const ch = await getChannel();

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
