import { randomUUID } from 'node:crypto';

export class InputError extends Error {}
const clean = value => String(value ?? '').replace(/\u00a7./g, '').replace(/[\x00-\x1f]/g, ' ').slice(0, 220);
export function locationFromText(text) {
  try {
    const d = JSON.parse(text);
    if (!d || typeof d.server !== 'string' || !/^[a-z0-9_-]{1,50}$/i.test(d.server)) return null;
    return { server: d.server, gametype: clean(d.gametype), mode: clean(d.mode), map: clean(d.map), observedAt: Date.now() };
  } catch { return null; }
}

// Public snapshots are an explicit allowlist. Credentials never appear in status or logs.
export class Accounts {
  #rows = new Map();
  constructor({ createBot, fetchProfile = profileForToken, log = () => {}, host = 'mc.hypixel.net', port, version = '1.8.9', timeout = 30000 }) {
    Object.assign(this, { createBot, fetchProfile, log, host, port, version, timeout });
  }
  snapshot() {
    return [...this.#rows.values()].map(r => ({ id: r.id, label: r.label, username: r.username, state: r.state,
      reason: r.reason, connectedAt: r.connectedAt, location: r.state === 'connected' ? r.location : null }));
  }
  add({ token, label = '' }) {
    if (typeof token !== 'string' || !token.trim() || token.length > 12000 || /\s/.test(token.trim())) throw new InputError('Paste one Minecraft Java access token.');
    if (this.#rows.size >= 3) throw new InputError('The test is limited to 3 accounts. Remove one first.');
    token = token.trim();
    if ([...this.#rows.values()].some(r => r.token === token)) throw new InputError('This token is already added.');
    const r = { id: randomUUID(), label: clean(label).slice(0, 40) || `Account ${this.#rows.size + 1}`, token,
      username: '', state: 'disconnected', reason: '', connectedAt: null, location: null, generation: 0, lastCommand: 0 };
    this.#rows.set(r.id, r);
    this.connect(r.id);
    return r.id;
  }
  row(id) {
    const row = this.#rows.get(id);
    if (!row) throw new InputError('Account not found.');
    return row;
  }
  connect(id) {
    const r = this.row(id);
    if (['validating', 'connecting', 'connected'].includes(r.state)) throw new InputError('This account is already connecting or connected.');
    r.state = 'validating'; r.reason = ''; r.location = null;
    const generation = ++r.generation;
    const current = () => this.#rows.get(id) === r && r.generation === generation;
    this.log(`${r.label}: checking session.`);
    // Return immediately; status polling observes validation and connection separately.
    void (async () => {
      let profile;
      try { profile = await this.fetchProfile(r.token); }
      catch (err) { if (current()) this.fail(r, err instanceof InputError ? err.message : 'Could not check the session. Try again.'); return; }
      if (!current()) return;
      if ([...this.#rows.values()].some(other => other !== r && other.uuid === profile.id)) {
        this.fail(r, 'This Minecraft account is already in the list.'); return;
      }
      r.uuid = profile.id; r.username = profile.name; r.state = 'connecting';
      let bot;
      try {
        bot = this.createBot({ host: this.host, ...(this.port ? { port: this.port } : {}), version: this.version,
          username: profile.name, profilesFolder: false, hideErrors: true, logErrors: false,
          auth(client, options) {
            options.haveCredentials = true;
            options.accessToken = r.token;
            client.session = { accessToken: r.token, selectedProfile: { id: profile.id, name: profile.name } };
            client.username = profile.name; client.uuid = profile.id;
            options.connect(client);
          } });
      } catch { this.fail(r, 'Minecraft client could not start.'); return; }
      r.bot = bot;
      r.connectTimer = setTimeout(() => { if (current()) this.fail(r, 'Connection timed out. Check the network and session.'); }, this.timeout);
      bot.on('spawn', () => {
        if (!current() || r.bot !== bot) return;
        clearTimeout(r.connectTimer); r.state = 'connected'; r.reason = ''; r.connectedAt ??= Date.now(); r.location = null;
        this.log(`${r.username}: connected; waiting for location.`);
        clearTimeout(r.locateTimer);
        r.locateTimer = setTimeout(() => { if (current() && r.bot === bot && r.state === 'connected') this.locate(r); }, 2500);
        clearInterval(r.locationInterval);
        r.locationInterval = setInterval(() => { if (current() && r.bot === bot && r.state === 'connected') this.locate(r); }, 20000);
      });
      bot.on('respawn', () => { if (current()) { r.location = null; } });
      bot.on('messagestr', text => {
        if (!current() || r.state !== 'connected') return;
        const location = locationFromText(text);
        if (location && Date.now() - (r.requestedLocationAt || 0) < 10000) {
          if (r.location?.server !== location.server) this.log(`${r.username}: ${location.server} · ${location.mode || location.gametype || 'lobby'}.`);
          r.location = location;
        }
      });
      bot.on('kicked', () => { if (current() && r.bot === bot) this.fail(r, 'Hypixel rejected or ended the session. Check the account in Minecraft.'); });
      bot.on('error', () => { if (current() && r.bot === bot) this.fail(r, 'Connection error. The session may have expired or the server may be unreachable.'); });
      bot.on('end', () => {
        if (!current() || r.bot !== bot) return;
        this.clearTimers(r); r.bot = null; r.location = null; r.connectedAt = null;
        r.state = 'disconnected'; r.reason ||= 'Server connection closed.';
        this.log(`${r.username || r.label}: disconnected.`);
      });
    })();
  }
  locate(r) {
    if (Date.now() - r.lastCommand < 2500) return;
    r.lastCommand = Date.now(); r.requestedLocationAt = Date.now();
    try { r.bot.chat('/locraw'); } catch { this.fail(r, 'Could not request location.'); }
  }
  clearTimers(r) { clearTimeout(r.connectTimer); clearTimeout(r.locateTimer); clearInterval(r.locationInterval); }
  fail(r, reason) {
    this.clearTimers(r); const bot = r.bot; r.bot = null;
    r.state = 'error'; r.reason = reason; r.connectedAt = null; r.location = null;
    try { bot?.end(); } catch {}
    this.log(`${r.username || r.label}: ${reason}`);
  }
  disconnect(id) {
    const r = this.row(id); ++r.generation; this.clearTimers(r);
    const bot = r.bot; r.bot = null; try { bot?.end(); } catch {}
    r.state = 'disconnected'; r.reason = 'Stopped by you.'; r.connectedAt = null; r.location = null;
    this.log(`${r.username || r.label}: stopped.`);
  }
  remove(id) { const r = this.row(id); this.disconnect(id); r.token = ''; this.#rows.delete(id); }
  stop() { for (const id of this.#rows.keys()) this.remove(id); }
  command({ id, action, leader }) {
    if (action === 'connect') return this.connect(id);
    if (action === 'disconnect') return this.disconnect(id);
    if (action === 'remove') return this.remove(id);
    const r = this.row(id);
    if (r.state !== 'connected' || !r.bot) throw new InputError('Connect this account first.');
    if (Date.now() - r.lastCommand < 3000) throw new InputError('Wait 3 seconds between commands.');
    const commands = { locate: '/locraw', lobby: '/lobby bedwars', solo: '/play bedwars_eight_one' };
    if (action === 'party') {
      if (typeof leader !== 'string' || !/^[a-z0-9_]{1,16}$/i.test(leader)) throw new InputError('Enter the party leader’s Minecraft username.');
      commands.party = `/party accept ${leader}`;
    }
    if (!commands[action]) throw new InputError('Unknown action.');
    r.lastCommand = Date.now();
    if (action === 'locate') r.requestedLocationAt = Date.now();
    else r.location = null;
    r.bot.chat(commands[action]);
    this.log(`${r.username}: ${commands[action]} sent. Server acceptance is not confirmed.`);
  }
}

export async function profileForToken(token) {
  let response;
  try { response = await fetch('https://api.minecraftservices.com/minecraft/profile', {
    headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000), redirect: 'error'
  }); } catch { throw new InputError('Minecraft session service is unreachable. Try again.'); }
  if ([401, 403].includes(response.status)) throw new InputError('Invalid or expired Minecraft Java access token.');
  if (response.status === 404) throw new InputError('No Minecraft Java profile exists for this token.');
  if (!response.ok) throw new InputError('Minecraft session service is unavailable or rate-limited. Try later.');
  const p = await response.json();
  if (!/^[a-f0-9]{32}$/i.test(p.id) || !/^[a-z0-9_]{1,16}$/i.test(p.name)) throw new InputError('Minecraft returned an invalid profile.');
  return { id: p.id, name: p.name };
}
