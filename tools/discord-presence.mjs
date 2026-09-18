#!/usr/bin/env node
/* ============================================================
   WAISH BOT PRESENCE — keeps the bot "online" with a Do Not Disturb status.
   The commands themselves are answered by the Cloudflare worker (tools/discord.bot.js); Discord only shows a
   status dot for bots that hold a Gateway (WebSocket) connection, and a worker can't hold one — so this small
   process does nothing but connect, identify with the presence below, and heartbeat. No intents, no message access.

   Run:      node tools/discord-presence.mjs            (reads DISCORD_BOT_TOKEN from tools/proxy.env)
   Service:  tools/waish-bot.service → /etc/systemd/system/, then `systemctl enable --now waish-bot`
   Env:      BOT_STATUS  = dnd | online | idle | invisible   (default dnd)
             BOT_ACTIVITY = the text shown under the name         (default "waish.ir")
   ============================================================ */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
try {   // tools/proxy.env → process.env (only keys that aren't set already)
  for (const ln of readFileSync(join(here, 'proxy.env'), 'utf8').split('\n')) {
    const m = ln.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); if (m && process.env[m[1]] == null) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch (e) {}
const TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!TOKEN) { console.error('DISCORD_BOT_TOKEN missing (tools/proxy.env)'); process.exit(1); }
const STATUS = process.env.BOT_STATUS || 'dnd';
const ACTIVITY = process.env.BOT_ACTIVITY || 'waish.ir';
const log = (...a) => console.log(new Date().toISOString(), ...a);

const presence = { since: null, afk: false, status: STATUS, activities: [{ name: ACTIVITY, type: 3 }] };   // type 3 = "Watching …"
let ws, seq = null, sessionId = null, resumeUrl = null, hb = null, acked = true, backoff = 1000, stopping = false;

function send(op, d) { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ op, d })); }
function heartbeat() { if (!acked) { log('no heartbeat ack — reconnecting'); return ws.close(4000); } acked = false; send(1, seq); }

function connect(resume) {
  const url = (resume && resumeUrl) || 'wss://gateway.discord.gg';
  log(resume ? 'resuming' : 'connecting', url);
  ws = new WebSocket(`${url}/?v=10&encoding=json`);
  ws.onmessage = ev => {
    const p = JSON.parse(ev.data); if (p.s != null) seq = p.s;
    switch (p.op) {
      case 10:   // HELLO: start heartbeating, then identify (or resume)
        clearInterval(hb); acked = true;
        hb = setInterval(heartbeat, p.d.heartbeat_interval);
        if (resume && sessionId) send(6, { token: TOKEN, session_id: sessionId, seq });
        else send(2, { token: TOKEN, intents: 0, properties: { os: 'linux', browser: 'waish', device: 'waish' }, presence });
        break;
      case 11: acked = true; break;                      // heartbeat ack
      case 1: send(1, seq); break;                       // gateway asks for a heartbeat
      case 7: log('gateway asked to reconnect'); ws.close(4000); break;
      case 9: log('invalid session', p.d ? '(resumable)' : '(fresh identify)'); if (!p.d) sessionId = null; setTimeout(() => ws.close(4000), 1000 + Math.random() * 4000); break;
      case 0:
        if (p.t === 'READY') { sessionId = p.d.session_id; resumeUrl = p.d.resume_gateway_url; backoff = 1000; log(`online as ${p.d.user.username}#${p.d.user.discriminator} — status ${STATUS}, watching "${ACTIVITY}"`); }
        else if (p.t === 'RESUMED') { backoff = 1000; log('resumed'); }
        break;
    }
  };
  ws.onclose = ev => {
    clearInterval(hb); if (stopping) return;
    if ([4004, 4010, 4011, 4012, 4013, 4014].includes(ev.code)) { log(`fatal close ${ev.code}: ${ev.reason}`); process.exit(1); }   // bad token / bad intents: don't loop
    const canResume = sessionId && ![4007, 4009].includes(ev.code) && ev.code !== 1000;
    log(`closed ${ev.code} ${ev.reason || ''} — retry in ${backoff}ms`);
    setTimeout(() => connect(canResume), backoff); backoff = Math.min(backoff * 2, 60000);
  };
  ws.onerror = ev => log('socket error', ev.message || '');
}
connect(false);
process.on('SIGTERM', () => { log('stopping'); stopping = true; clearInterval(hb); if (ws) ws.close(1000); setTimeout(() => process.exit(0), 500); });
process.on('SIGINT', () => process.emit('SIGTERM'));
