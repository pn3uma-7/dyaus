const { getChannel, QUEUE_NAME } = require('../services/queue');

async function pushJob(jobId, body, keyRecord) {
  const ch = await getChannel();
  const payload = Buffer.from(JSON.stringify({ jobId, body, keyRecord }));
  ch.sendToQueue(QUEUE_NAME, payload, { persistent: true });
}

module.exports = { pushJob };
