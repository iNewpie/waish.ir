import { randomUUID } from 'node:crypto';

export class InputError extends Error {}
const clean = value => String(value ?? '').replace(/\u00a7./g, '').replace(/[\x00-\x1f]/g, ' ').slice(0, 220);
// Classify dependency errors without logging request objects, session tokens or stacks.
export function connectionFailure(error, stage = 'Minecraft login') {
  const errors = [error, error?.cause, ...(Array.isArray(error?.errors) ? error.errors.slice(0, 8) : [])];
  const codes = new Set(errors.map(e => e?.code));
  const has = (...values) => values.some(code => codes.has(code));
  if (has('ENOTFOUND', 'EAI_AGAIN', 'ESERVFAIL')) return `${stage}: DNS lookup failed. Check this PC's DNS/network connection.`;
  if (has('ECONNREFUSED')) return `${stage}: connection refused (ECONNREFUSED). The destination or network rejected the connection.`;
  if (has('ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT') || errors.some(e => e?.name === 'TimeoutError')) return `${stage}: network request timed out (ETIMEDOUT).`;
  if (has('ENETUNREACH', 'EHOSTUNREACH', 'EADDRNOTAVAIL')) return `${stage}: no network route to the destination.`;
  if (has('ECONNRESET', 'EPIPE', 'UND_ERR_SOCKET')) return `${stage}: connection closed or reset by the server/network.`;
  if (has('CERT_HAS_EXPIRED', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'SELF_SIGNED_CERT_IN_CHAIN', 'ERR_TLS_CERT_ALTNAME_INVALID')) return `${stage}: HTTPS certificate verification failed. Check the PC clock and HTTPS inspection settings.`;
  const messages = errors.map(e => typeof e?.message === 'string' ? e.message : '').join(' ');
  if (/invalid token|invalid session|invalid credentials|forbiddenoperationexception/i.test(messages)) return `${stage}: Minecraft rejected session authorization. The profile check passed, but the session cannot join this server.`;
  if (/too many requests|rate.limit/i.test(messages)) return `${stage}: session service rate limit reached. Wait before retrying.`;
  if (/request blocked by cloudflare|ip is banned by cloudflare/i.test(messages)) return `${stage}: the session service blocked this network's request.`;
  if (/serialization error|deserialization error|partialreaderror|read error for/i.test(messages)) return `${stage}: Minecraft protocol parsing failed. Report this message so the client compatibility can be checked.`;
  return `${stage}: connection failed without a recognized error code. The profile check passed; token expiry is not confirmed.`;
}

export function kickReason(reason, tokens = []) {
  let nodes = 0;
  const parts = (value, depth = 0) => {
    if (++nodes > 40 || depth > 6) return '';
    if (typeof value === 'string') return value.length > 20000 ? '[long message omitted]' : value;
    if (Array.isArray(value)) return value.map(v => parts(v, depth + 1)).join(' ');
    if (value && typeof value === 'object') return [parts(value.text, depth + 1), parts(value.translate, depth + 1), parts(value.with, depth + 1), parts(value.extra, depth + 1)].filter(Boolean).join(' ');
    return '';
  };
  if (typeof reason === 'string' && reason.length <= 20000) { try { reason = JSON.parse(reason); } catch {} }
  let result = parts(reason);
  for (const token of tokens) if (token) result = result.split(token).join('[redacted]');
  result = result.replace(/Bearer\s+\S+/gi, 'Bearer [redacted]').replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)?/g, '[redacted]').replace(/https?:\/\/\S+/gi, '[link omitted]');
  return clean(result).trim();
}
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
      r.stage = 'Hypixel connection';
      this.log(`${r.username}: session profile accepted; connecting to Hypixel.`);
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
      } catch (err) { this.fail(r, connectionFailure(err, 'Minecraft client startup')); return; }
      r.bot = bot;
      r.connectTimer = setTimeout(() => { if (current()) this.fail(r, `${r.stage}: timed out waiting for the next login step.`); }, this.timeout);
      bot.on('connect', () => {
        if (!current() || r.bot !== bot) return;
        r.stage = 'Minecraft login'; this.log(`${r.username}: TCP connected; waiting for Minecraft login.`);
      });
      bot._client?.on('encryption_begin', () => {
        if (!current() || r.bot !== bot) return;
        r.stage = 'Minecraft session authorization'; this.log(`${r.username}: server requested session authorization.`);
      });
      bot.on('login', () => {
        if (!current() || r.bot !== bot) return;
        r.stage = 'World loading'; this.log(`${r.username}: Minecraft login accepted; waiting for spawn.`);
      });
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
      bot.on('kicked', reason => { if (current() && r.bot === bot) {
        const detail = kickReason(reason, [...this.#rows.values()].map(row => row.token));
        this.fail(r, detail ? `Server disconnected the account: ${detail}` : 'Server disconnected the account without a readable reason.');
      } });
      bot.on('error', err => { if (current() && r.bot === bot) this.fail(r, connectionFailure(err, r.stage)); });
      bot.on('end', () => {
        if (!current() || r.bot !== bot) return;
        this.clearTimers(r); r.bot = null; r.location = null; r.connectedAt = null;
        r.state = 'disconnected'; r.reason ||= `Server connection closed during ${r.stage}.`;
        this.log(`${r.username || r.label}: ${r.reason}`);
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
