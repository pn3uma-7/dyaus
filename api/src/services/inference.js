const config = require('../config');

async function chatCompletion(body) {
  const url = `${config.inference.base}/v1/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...body,
      model: 'local',
      stream: false,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    const err = new Error(`Inference error ${response.status}: ${text}`);
    err.status = response.status;
    throw err;
  }

  return response.json();
}

async function isAvailable() {
  try {
    const response = await fetch(`${config.inference.base}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

module.exports = { chatCompletion, isAvailable };
