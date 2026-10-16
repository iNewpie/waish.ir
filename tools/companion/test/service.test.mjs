import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter, once } from 'node:events';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import http from 'node:http';
import { Accounts, InputError } from '../accounts.mjs';
import { makeService, sameInstance } from '../server.mjs';
const flush = () => new Promise(resolve => setImmediate(resolve));
const profile = { id: '12345678901234567890123456789012', name: 'TestAccount' };
const key = 'ab'.repeat(32);
function fakeFactory(bots) { return () => { const b = new EventEmitter(); b.chat = c => { b.command = c; }; b.end = () => { b.ended = true; b.emit('end'); }; bots.push(b); return b; }; }

test('connection status requires spawn; disconnect, errors, and secret redaction', async () => {
  const bots = [], logs = [];
  const m = new Accounts({ createBot: fakeFactory(bots), fetchProfile: async () => profile, log: s => logs.push(s) });
  const token = 'test-secret-access-token';
  const id = m.add({ token }); assert.equal(m.snapshot()[0].state, 'validating');
  await flush(); assert.equal(m.snapshot()[0].state, 'connecting');
  bots[0].emit('spawn'); assert.equal(m.snapshot()[0].state, 'connected');
  m.command({ id, action: 'locate' });
  bots[0].emit('messagestr', '{"server":"mini156H","gametype":"BEDWARS","mode":"BEDWARS_EIGHT_ONE"}');
  assert.equal(m.snapshot()[0].location.server, 'mini156H');
  bots[0].emit('error', new Error(token));
  assert.equal(m.snapshot()[0].state, 'error');
  assert.equal(m.snapshot()[0].location, null);
  assert.ok(!JSON.stringify([m.snapshot(), logs]).includes(token));
  m.stop(); assert.equal(m.snapshot().length, 0); assert.ok(bots[0].ended);
});
test('stop during validation cancels connection, limits reserve slots, duplicate profiles rejected', async () => {
  const bots = []; let finish;
  const m = new Accounts({ createBot: fakeFactory(bots), fetchProfile: () => new Promise(r => finish = r) });
  m.add({ token: 'first' }); m.stop(); finish(profile); await flush(); assert.equal(bots.length, 0);
  const m2 = new Accounts({ createBot: fakeFactory(bots), fetchProfile: async () => profile });
  m2.add({ token: 'first' }); m2.add({ token: 'second' }); m2.add({ token: 'third' });
  assert.throws(() => m2.add({ token: 'fourth' }), /limited to 3/);
  await flush(); assert.equal(m2.snapshot().filter(a => a.state === 'error').length, 2);
  m2.stop();
});
test('invalid token is an error, not a connected account; party input cannot inject commands', async () => {
  const bad = new Accounts({ createBot: () => { throw Error('must not create'); }, fetchProfile: async () => { throw new InputError('Invalid or expired Minecraft Java access token.'); } });
  bad.add({ token: 'expired' }); await flush(); assert.equal(bad.snapshot()[0].state, 'error'); bad.stop();
  const bots = []; const m = new Accounts({ createBot: fakeFactory(bots), fetchProfile: async () => profile });
  const id = m.add({ token: 'valid' }); await flush(); bots[0].emit('spawn');
  assert.throws(() => m.command({ id, action: 'party', leader: 'test\n/other' }), /username/); m.stop();
});
test('fresh locations compare independently of connection status', () => {
  const a = { server: 'mini156H', observedAt: Date.now() };
  assert.equal(sameInstance(a, a), true);
  assert.equal(sameInstance(a, { ...a, server: 'mini12A' }), false);
  assert.equal(sameInstance(a, { ...a, observedAt: Date.now() - 46000 }), null);
  assert.equal(sameInstance(null, a), null);
});
test('local API enforces key, origin, desktop-only Start/Stop, clears accounts on Stop', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'waish-test-'));
  const trackerPath = join(dir, 'location.json');
  await writeFile(trackerPath, JSON.stringify({ server: 'mini156H', observedAt: Date.now() }));
  const s = makeService({ key, port: 0, createBot: fakeFactory([]), fetchProfile: async () => profile, trackerPath });
  const address = await s.listen(); const base = `http://127.0.0.1:${address.port}`;
  t.after(async () => { s.stop(); s.server.closeAllConnections(); await new Promise(r => s.server.close(r)); await rm(dir, { recursive: true, force: true }); });
  const req = (path, body, extra = {}) => fetch(base + path, { method: body ? 'POST' : 'GET', headers: { 'X-Waish-Key':key, ...(body ? { 'Content-Type':'application/json' } : {}), ...extra }, body: body ? JSON.stringify(body) : undefined });
  assert.equal((await fetch(base + '/status')).status, 401);
  assert.equal((await req('/status', null, { 'X-Waish-Key': 'x'.repeat(64) })).status, 401);
  assert.equal((await req('/status', null, { Origin:'https://evil.example' })).status, 403);
  const preflight = await fetch(base + '/status', { method: 'OPTIONS', headers: { Origin:'https://waish.ir', 'Access-Control-Request-Method':'GET' } });
  assert.equal(preflight.status, 204); assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), 'https://waish.ir');
  assert.equal((await req('/app/start', {}, { Origin:'https://waish.ir' })).status, 403);
  assert.equal((await req('/accounts/add', { token:'abc' })).status, 409);
  assert.equal((await req('/app/start', {})).status, 200);
  const status = await (await req('/status')).json(); assert.equal(status.player.server, 'mini156H');
  const added = await (await req('/accounts/add', { token:'private-token' }, { Origin:'https://waish.ir' })).json();
  assert.equal(added.accounts.length, 1); assert.ok(!JSON.stringify(added).includes('private-token'));
  const stopped = await (await req('/app/stop', {})).json(); assert.equal(stopped.accounts.length, 0); assert.equal(stopped.player, null); assert.equal(stopped.running, false);
  // A foreign Host is rejected even if a DNS name resolves to loopback.
  const foreignHostStatus = await new Promise(resolve => {
    const r = http.request(base + '/status', { headers: { Host:'evil.example', 'X-Waish-Key':key } }, response => { response.resume(); resolve(response.statusCode); }); r.end();
  });
  assert.equal(foreignHostStatus, 403);
});

test('real Minecraft 1.8.9 protocol: connect, spawn, locraw response, disconnect', { timeout: 15000 }, async t => {
  const { default: protocol } = await import('minecraft-protocol');
  const { default: mineflayer } = await import('mineflayer');
  const server = protocol.createServer({ 'online-mode': false, host: '127.0.0.1', port: 0, version: '1.8.9' });
  await once(server, 'listening');
  const port = server.socketServer.address().port;
  const manager = new Accounts({ createBot: options => mineflayer.createBot(options), host:'127.0.0.1', port, fetchProfile:async () => profile, timeout:10000 });
  t.after(() => { manager.stop(); server.close(); });
  server.on('login', client => {
    client.write('login', { entityId:1, gameMode:0, dimension:0, difficulty:1, maxPlayers:3, levelType:'default', reducedDebugInfo:false });
    client.write('position', { x:0, y:65, z:0, yaw:0, pitch:0, flags:0 });
    client.write('update_health', { health:20, food:20, foodSaturation:5 });
    client.on('chat', packet => {
      if (packet.message === '/locraw') client.write('chat', { message:JSON.stringify({ text:JSON.stringify({ server:'miniTest', gametype:'BEDWARS', mode:'BEDWARS_EIGHT_ONE' }) }), position:0 });
    });
  });
  const id = manager.add({ token:'local-protocol-test' });
  const until = async predicate => { const deadline = Date.now() + 10000; while (!predicate()) { assert.ok(Date.now() < deadline, JSON.stringify(manager.snapshot())); await new Promise(r => setTimeout(r, 40)); } };
  await until(() => manager.snapshot()[0].state === 'connected');
  manager.command({ id, action:'locate' });
  await until(() => manager.snapshot()[0].location?.server === 'miniTest');
  manager.disconnect(id); assert.equal(manager.snapshot()[0].state, 'disconnected');
});
