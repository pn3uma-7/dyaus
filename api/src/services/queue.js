const amqp = require('amqplib');
const config = require('../config');

const QUEUE_NAME = 'inference_jobs';

let connection = null;
let channel = null;

async function connect() {
  connection = await amqp.connect(config.rabbitmq.url);
  channel = await connection.createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });
  connection.on('error', (err) => {
    console.error('RabbitMQ connection error:', err);
    connection = null;
    channel = null;
  });
  return channel;
}

async function getChannel() {
  if (channel) return channel;
  return connect();
}

async function close() {
  if (connection) {
    await connection.close();
    connection = null;
    channel = null;
  }
}

module.exports = { getChannel, close, QUEUE_NAME };
