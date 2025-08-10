const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);
const JOB_QUEUE = process.env.JOB_QUEUE || 'mc_jobs';
const SERVERS_DIR = process.env.SERVERS_DIR || '/data/servers';
const DOWNLOAD_DIR = process.env.DOWNLOAD_DIR || '/data/downloads';
const EULA_OK = (process.env.EULA || 'TRUE').toUpperCase() === 'TRUE';

const running = new Map();

function jarName({ type, version }) {
  if (type === 'paper') return `paper-${version}.jar`;
  return `paper-${version}.jar`;
}

function fileExists(p) {
  try { return fs.existsSync(p); } catch { return false; }
}

function sh(args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(args[0], args.slice(1), { stdio: 'inherit', ...opts });
    p.on('exit', code => code === 0 ? resolve() : reject(new Error(`cmd failed ${code}`)));
  });
}

async function ensureJar({ type, version }) {
  const jar = jarName({ type, version });
  const jarPath = path.join(DOWNLOAD_DIR, jar);
  if (fileExists(jarPath)) return jarPath;
  await sh(['/runner/get_jar.sh', type, version, jarPath]);
  if (!fileExists(jarPath)) throw new Error('Jar download failed');
  return jarPath;
}

function writeEula(dir) {
  fs.writeFileSync(path.join(dir, 'eula.txt'), `eula=${EULA_OK ? 'true' : 'false'}\n`);
}

function writeProps(dir) {
  const props = [
    'online-mode=true',
    'motd=MineCloudAI Server',
    'enable-command-block=true',
    'spawn-protection=0'
  ].join('\n') + '\n';
  fs.writeFileSync(path.join(dir, 'server.properties'), props);
}

async function createServer({ id, type, version, memoryMb }) {
  const dir = path.join(SERVERS_DIR, id);
  if (!fileExists(dir)) fs.mkdirSync(dir, { recursive: true });

  const jarPath = await ensureJar({ type, version });

  writeEula(dir);
  writeProps(dir);

  const Xms = Math.max(512, Math.min(memoryMb || 2048, 16384));
  const Xmx = Xms;

  console.log(`[runner] starting ${id} with ${Xmx} MB`);
  const child = spawn('java', [
    `-Xms${Xms}M`, `-Xmx${Xmx}M`,
    '-XX:+UseG1GC', '-XX:MaxGCPauseMillis=50',
    '-jar', jarPath, 'nogui'
  ], { cwd: dir, stdio: 'inherit' });

  running.set(id, child);

  child.on('exit', code => {
    console.log(`[runner] server ${id} exited ${code}`);
    running.delete(id);
  });

  return { id, status: 'starting' };
}

async function stopServer({ id }) {
  const child = running.get(id);
  if (!child) return { id, status: 'not_running' };
  console.log(`[runner] stopping ${id} ...`);
  child.kill('SIGTERM');
  return { id, status: 'stopping' };
}

async function main() {
  console.log(`[runner] listening on queue ${JOB_QUEUE}`);
  while (true) {
    const res = await redis.brpop(JOB_QUEUE, 0);
    const payload = JSON.parse(res[1]);
    try {
      if (payload.action === 'create') {
        await createServer(payload);
      } else if (payload.action === 'stop') {
        await stopServer(payload);
      } else {
        console.warn('[runner] unknown action', payload);
      }
    } catch (e) {
      console.error('[runner] job failed', e);
    }
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
