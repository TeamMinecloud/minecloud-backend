const { v4: uuid } = require('uuid');
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);
const QUEUE = process.env.PROVISIONER_QUEUE || 'mc_jobs';

async function requestCreate({ version, type, memoryMb }) {
  const id = `srv_${uuid()}`;
  const job = { action: "create", id, version, type, memoryMb };
  await redis.lpush(QUEUE, JSON.stringify(job));
  return { accepted: true, id };
}

async function requestStop({ id }) {
  const job = { action: "stop", id };
  await redis.lpush(QUEUE, JSON.stringify(job));
  return { accepted: true, id };
}

module.exports = { requestCreate, requestStop };
