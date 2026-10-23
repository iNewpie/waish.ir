import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter, once } from 'node:events';
import http from 'node:http';
import { Accounts, connectionFailure, kickReason } from '../accounts.mjs';
const flush = () => new Promise(resolve => setImmediate(resolve));
const profile = { id:'12345678901234567890123456789012', name:'TestAccount' };

test('network diagnostics distinguish DNS, TCP, HTTPS and session authorization errors', () => {
  assert.match(connectionFailure({ code:'ENOTFOUND' }), /DNS lookup/);
  assert.match(connectionFailure(new AggregateError([{ code:'ETIMEDOUT' }]), 'Hypixel connection'), /Hypixel connection:.*ETIMEDOUT/);
  assert.match(connectionFailure({ cause:{code:'ECONNREFUSED'} }), /ECONNREFUSED/);
  assert.match(connectionFailure({ code:'ECONNRESET' }), /reset/);
  assert.match(connectionFailure({ code:'CERT_HAS_EXPIRED' }), /certificate/);
  assert.match(connectionFailure(Error('Invalid token'), 'Minecraft session authorization'), /rejected session authorization/);
  assert.match(connectionFailure(Error('Too many requests')), /rate limit/);
  const secret = 'private-session-access-token';
  assert.ok(!connectionFailure(Error(secret)).includes(secret));
});

test('server kick components are readable while tokens and credential links are redacted before truncation', () => {
  const token = 's'.repeat(500);
  const reason = JSON.stringify({ text:'Disconnected: ', extra:[{text:'Already connected'}, {text:token}, {text:' https://example.test/?token=private'}, {text:' Bearer private'}] });
  const formatted = kickReason(reason, [token]);
  assert.match(formatted, /Already connected/);
  assert.ok(!formatted.includes('s'.repeat(25)));
  assert.ok(!formatted.includes('private'));
  assert.equal(kickReason(null), '');
});

test('connection stages and failures reach logs without any session secrets', async t => {
  const logs = [], token = 'private-token-never-log';
  const bot = new EventEmitter(); bot._client = new EventEmitter(); bot.end = () => {}; bot.chat = () => {};
  const manager = new Accounts({ createBot:() => bot, fetchProfile:async () => profile, log:value => logs.push(value) });
  t.after(() => manager.stop());
  manager.add({ token }); await flush();
  assert.match(logs.at(-1), /profile accepted/);
  bot.emit('connect'); assert.match(logs.at(-1), /TCP connected/);
  bot._client.emit('encryption_begin'); assert.match(logs.at(-1), /session authorization/);
  bot.emit('error', Object.assign(Error(token), {code:'ETIMEDOUT'}));
  assert.match(manager.snapshot()[0].reason, /Minecraft session authorization:.*ETIMEDOUT/);
  assert.ok(!JSON.stringify([logs,manager.snapshot()]).includes(token));
});

test('server kicks preserve their reason instead of reporting token expiry', async t => {
  const bot = new EventEmitter(); bot.end = () => {}; bot.chat = () => {};
  const manager = new Accounts({ createBot:() => bot, fetchProfile:async () => profile });
  t.after(() => manager.stop());
  manager.add({ token:'fake-token' }); await flush();
  bot.emit('kicked', { text:'You logged in from another location.' });
  assert.match(manager.snapshot()[0].reason, /logged in from another location/);
});

test('encrypted Minecraft 1.8.9 login forwards the validated session to the join service', { timeout:15000 }, async t => {
  const { default:protocol } = await import('minecraft-protocol');
  const { default:mineflayer } = await import('mineflayer');
  const token = 'local-encrypted-login-test';
  const server = protocol.createServer({ 'online-mode':true, host:'127.0.0.1', port:0, version:'1.8.9', hideErrors:true });
  await once(server, 'listening');
  let joinRequest;
  const session = http.createServer(async (req,res) => {
    assert.equal(req.url, '/session/minecraft/join');
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    joinRequest = JSON.parse(Buffer.concat(chunks).toString());
    // This local test trusts the fake join response, so it never calls Mojang.
    server.onlineModeExceptions[profile.name.toLowerCase()] = true;
    res.writeHead(204); res.end();
  });
  session.listen(0,'127.0.0.1'); await once(session,'listening');
  const logs = [];
  const manager = new Accounts({
    host:'127.0.0.1', port:server.socketServer.address().port, timeout:10000,
    fetchProfile:async () => profile, log:line => logs.push(line),
    createBot:options => mineflayer.createBot({ ...options, sessionServer:`http://127.0.0.1:${session.address().port}` })
  });
  t.after(async () => { manager.stop(); server.close(); session.closeAllConnections(); await new Promise(resolve => session.close(resolve)); });
  server.on('login', client => {
    client.write('login',{entityId:1,gameMode:0,dimension:0,difficulty:1,maxPlayers:3,levelType:'default',reducedDebugInfo:false});
    client.write('position',{x:0,y:65,z:0,yaw:0,pitch:0,flags:0});
    client.write('update_health',{health:20,food:20,foodSaturation:5});
  });
  manager.add({token});
  const deadline = Date.now()+10000;
  while(manager.snapshot()[0].state !== 'connected') {
    assert.ok(Date.now()<deadline,JSON.stringify(manager.snapshot()));
    await new Promise(resolve => setTimeout(resolve,40));
  }
  assert.equal(joinRequest.accessToken, token);
  assert.equal(joinRequest.selectedProfile, profile.id);
  assert.match(joinRequest.serverId,/^-?[0-9a-f]+$/);
  assert.ok(logs.some(line => line.includes('server requested session authorization')));
  assert.ok(logs.some(line => line.includes('Minecraft login accepted')));
  assert.ok(!JSON.stringify([logs,manager.snapshot()]).includes(token));
});
