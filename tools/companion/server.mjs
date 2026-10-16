import http from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Accounts, InputError } from './accounts.mjs';

export const PORT = 47836;
const ORIGINS = new Set(['https://waish.ir', 'https://www.waish.ir']);
export function freshLocation(value, now = Date.now()) {
  if (!value || typeof value.server !== 'string' || !/^[a-z0-9_-]{1,50}$/i.test(value.server) ||
      !Number.isFinite(value.observedAt) || now - value.observedAt > 45000 || value.observedAt > now + 5000) return null;
  const field = v => typeof v === 'string' ? v.slice(0, 80) : '';
  return { server: value.server, gametype: field(value.gametype), mode: field(value.mode), map: field(value.map), observedAt: value.observedAt };
}
export function sameInstance(accountLocation, playerLocation) {
  const a = freshLocation(accountLocation), b = freshLocation(playerLocation);
  return a && b ? a.server.toLowerCase() === b.server.toLowerCase() : null;
}

export function makeService({ createBot, key, fetchProfile, trackerPath = join(homedir(), '.waish-companion', 'location.json'), port = PORT } = {}) {
  if (!/^[a-f0-9]{64}$/.test(key || '')) throw new Error('A 32-byte pairing key is required.');
  let running = false, target = null, lastTrackerRead = 0;
  const logs = [];
  const log = message => { logs.push({ time: new Date().toISOString(), message }); if (logs.length > 150) logs.shift(); };
  const accounts = new Accounts({ createBot, fetchProfile, log });
  const snapshot = async () => {
    if (running && Date.now() - lastTrackerRead > 1000) {
      lastTrackerRead = Date.now();
      try { if ((await stat(trackerPath)).size > 4096) throw Error(); target = freshLocation(JSON.parse(await readFile(trackerPath, 'utf8'))); }
      catch { target = null; }
    }
    const player = running ? freshLocation(target) : null;
    return { ok: true, version: '0.1.0', running, player, accounts: accounts.snapshot().map(a => {
      const location = freshLocation(a.location);
      return { ...a, location, sameInstance: a.state === 'connected' ? sameInstance(location, player) : null };
    }), logs };
  };
  const stop = () => { accounts.stop(); running = false; target = null; log('Stopped. Accounts disconnected and tokens cleared from memory.'); };
  const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin;
    const host = req.headers.host;
    const expectedHost = `127.0.0.1:${server.address()?.port ?? port}`;
    const reply = (status, obj) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(obj)); };
    if (host !== expectedHost || (origin && !ORIGINS.has(origin))) return reply(403, { ok: false, cause: 'Origin or host not allowed.' });
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Waish-Key');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Private-Network', 'true');
      res.setHeader('Access-Control-Max-Age', '300');
    }
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    const supplied = req.headers['x-waish-key'];
    if (typeof supplied !== 'string' || !/^[a-f0-9]{64}$/.test(supplied) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(key))) return reply(401, { ok: false, cause: 'Pairing code is incorrect. Copy the code from the app.' });
    // No URL arguments, cookies, disk storage, telemetry, or body logging for credentials.
    try {
      if (req.url === '/status' && req.method === 'GET') return reply(200, await snapshot());
      if (req.method !== 'POST') return reply(405, { ok: false, cause: 'Method not allowed.' });
      if (!String(req.headers['content-type']).startsWith('application/json')) return reply(415, { ok: false, cause: 'JSON required.' });
      let size = 0, chunks = [];
      for await (const chunk of req) { size += chunk.length; if (size > 16000) return reply(413, { ok: false, cause: 'Request is too large.' }); chunks.push(chunk); }
      let body; try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new InputError('Invalid JSON.'); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new InputError('Invalid request.');
      if (req.url.startsWith('/app/')) {
        if (origin) return reply(403, { ok: false, cause: 'Use the companion app to start or stop.' });
        if (req.url === '/app/start') { if (!running) { running = true; lastTrackerRead = 0; log('Started. Open waish.ir/admin → Botting to add accounts.'); } }
        else if (req.url === '/app/stop') stop();
        else if (req.url === '/app/exit') { stop(); reply(200, { ok: true }); setImmediate(() => server.close()); return; }
        else return reply(404, { ok: false, cause: 'Unknown route.' });
        return reply(200, await snapshot());
      }
      if (!running) return reply(409, { ok: false, cause: 'Press Start in the companion app first.' });
      // Profile validation is asynchronous and account slots are reserved immediately.
      if (req.url === '/accounts/add') accounts.add(body);
      else if (req.url === '/accounts/action') accounts.command(body);
      else return reply(404, { ok: false, cause: 'Unknown route.' });
      return reply(200, await snapshot());
    } catch (err) { reply(err instanceof InputError ? 400 : 500, { ok: false, cause: err instanceof InputError ? err.message : 'Request failed. Check the app and retry.' }); }
  });
  server.requestTimeout = 10000; server.headersTimeout = 10000;
  server.on('close', () => accounts.stop());
  log('Ready. Press Start, then pair from the website.');
  return { server, accounts, stop, snapshot, listen: () => new Promise((resolve, reject) => {
    server.once('error', reject); server.listen(port, '127.0.0.1', () => { server.removeListener('error', reject); resolve(server.address()); });
  }) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { default: mineflayer } = await import('mineflayer');
  const key = process.env.WAISH_LOCAL_KEY || randomBytes(32).toString('hex');
  delete process.env.WAISH_LOCAL_KEY;
  const service = makeService({ createBot: options => mineflayer.createBot(options), key });
  try { await service.listen(); }
  catch { console.error('The companion port is already in use. Close the other instance and try again.'); process.exit(1); }
  // The desktop launcher passes the key privately and displays it in its own window.
  console.log('Waish Companion is ready on 127.0.0.1:' + PORT);
  const exit = () => { service.stop(); service.server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 2000).unref(); };
  process.on('SIGINT', exit); process.on('SIGTERM', exit);
  const parentPid = Number(process.env.WAISH_PARENT_PID);
  if (Number.isInteger(parentPid) && parentPid > 0) setInterval(() => {
    try { process.kill(parentPid, 0); } catch { exit(); }
  }, 2000).unref();
}
