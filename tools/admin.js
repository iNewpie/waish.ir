/* ============================================================
   WAISH ADMIN + VISITOR ANALYTICS — lives inside the Cloudflare proxy worker (tools/proxy.worker.js).

   Visitors:  every page of waish.ir loads js/hit.js, which POSTs one tiny beacon to <worker>/hit. The worker
              stores the hit in a Durable Object with SQLite storage (class Analytics, one instance named "main"):
              day (Asia/Tehran), path, an anonymous visitor id (sha256 of ip + user-agent + day + secret — no IP is
              ever stored, and the id changes every day), country, referrer host, device kind, language.
              Bots/crawlers are dropped by user-agent.
   Admin:     admin/index.html on the site talks to
                POST   /admin/login      {password}                → {token}  (30 days, HMAC-signed, rate-limited)
                GET    /admin/stats?days=30                        → daily series, totals, top pages / countries / referrers / devices
                GET    /admin/packs                                → the texture-pack list (assets/packs/packs.json on GitHub)
                POST   /admin/packs      multipart: name, desc, meta, link?, file?, img?   → commits the files + list to GitHub
                PATCH  /admin/packs      {id, name, desc, meta, link}                      → edits an entry
                DELETE /admin/packs?id=… → removes files + entry
              Packs are committed straight into iNewpie/waish.ir (branch main) through GitHub's Git Data API, so
              GitHub Pages redeploys them like any other push and everything stays in the one repo.
   Secrets:   ADMIN_PASSWORD (login + token key + visitor-id salt), GITHUB_TOKEN (Contents read/write on the repo).
   ============================================================ */

const REPO = 'iNewpie/waish.ir', BRANCH = 'main', PACKS_JSON = 'assets/packs/packs.json', PACKS_DIR = 'assets/packs';
const MAX_PACK = 40 * 1024 * 1024, MAX_IMG = 3 * 1024 * 1024;
const TOKEN_TTL = 30 * 24 * 3600 * 1000;
const BOT_RE = /bot|crawl|spider|slurp|headless|lighthouse|pingdom|preview|facebookexternalhit|whatsapp|telegram|discordapp|curl|wget|python-requests|go-http-client|okhttp|axios|node-fetch/i;

const enc = s => new TextEncoder().encode(s);
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const sha256 = async s => hex(await crypto.subtle.digest('SHA-256', enc(s)));
const json = (obj, status, cors) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...cors } });
const tehranDay = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);   // YYYY-MM-DD
const stub = env => env.ANALYTICS.get(env.ANALYTICS.idFromName('main'));
const doCall = (env, path, body) => stub(env).fetch(new Request('https://analytics.internal' + path, body === undefined ? {} : { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }));

/* ---------- visitor beacon ---------- */
export async function recordHit(request, env, ctx, cors) {
  if (request.method !== 'POST') return json({ ok: false, cause: 'POST a beacon here' }, 405, cors);
  if (!env.ANALYTICS) return json({ ok: false, cause: 'analytics not configured' }, 503, cors);
  const ua = request.headers.get('User-Agent') || '';
  if (!ua || BOT_RE.test(ua)) return new Response(null, { status: 204, headers: cors });
  let b = {}; try { b = await request.json(); } catch (e) {}
  let path = typeof b.p === 'string' ? b.p.split('?')[0].split('#')[0].slice(0, 200) : '/';
  if (!path.startsWith('/')) path = '/' + path;
  path = path.replace(/\/index\.html$/, '/');
  let ref = ''; try { const h = new URL(String(b.r || '')).hostname.replace(/^www\./, ''); if (h && !/(^|\.)waish\.ir$/.test(h)) ref = h.slice(0, 80); } catch (e) {}
  const dev = /iPad|Tablet/i.test(ua) ? 'tablet' : /Mobi|Android/i.test(ua) ? 'mobile' : 'desktop';
  const now = Date.now(), day = tehranDay(new Date(now));
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const vid = (await sha256(`${ip}|${ua}|${day}|${env.ADMIN_PASSWORD || 'waish'}`)).slice(0, 16);
  const hit = { ts: now, day, path, vid, country: (request.cf && request.cf.country) || '??', ref, dev, lang: String(b.l || '').slice(0, 8).toLowerCase() };
  ctx.waitUntil(doCall(env, '/hit', hit));
  return new Response(null, { status: 204, headers: cors });
}

/* ---------- auth ---------- */
async function tokenKey(env) {
  return crypto.subtle.importKey('raw', enc(await sha256(env.ADMIN_PASSWORD + '|token')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}
const sign = async (env, exp) => hex(await crypto.subtle.sign('HMAC', await tokenKey(env), enc('waish-admin|' + exp)));
const same = (a, b) => a.length === b.length && crypto.subtle.timingSafeEqual(enc(a), enc(b));
async function authed(request, env) {
  const m = /^Bearer\s+(\d+)\.([0-9a-f]{64})$/.exec(request.headers.get('Authorization') || '');
  if (!m || Number(m[1]) < Date.now()) return false;
  return same(await sign(env, m[1]), m[2]);
}
async function login(request, env, cors) {
  const ip = request.headers.get('CF-Connecting-IP') || '?';
  const gate = env.ANALYTICS ? await (await doCall(env, '/login-check', { ip })).json() : { blocked: false };
  if (gate.blocked) return json({ ok: false, cause: 'Too many attempts — try again in 15 minutes' }, 429, cors);
  let b = {}; try { b = await request.json(); } catch (e) {}
  const given = String(b.password || '');
  if (!given || !same(await sha256('pw|' + given), await sha256('pw|' + env.ADMIN_PASSWORD))) {
    if (env.ANALYTICS) await doCall(env, '/login-fail', { ip });
    return json({ ok: false, cause: 'Wrong password' }, 401, cors);
  }
  const exp = Date.now() + TOKEN_TTL;
  return json({ ok: true, token: `${exp}.${await sign(env, exp)}`, exp }, 200, cors);
}

/* ---------- GitHub (Git Data API) ---------- */
const gh = async (env, path, init = {}) => {
  const r = await fetch('https://api.github.com/repos/' + REPO + path, { ...init, headers: { Authorization: 'Bearer ' + env.GITHUB_TOKEN, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'waish.ir admin', ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...(init.headers || {}) } });
  let d = null; try { d = await r.json(); } catch (e) {}
  if (!r.ok) throw new Error(`GitHub ${init.method || 'GET'} ${path} → ${r.status}: ${(d && d.message) || 'error'}`);
  return d;
};
const b64 = buf => { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
const utf8b64 = s => b64(enc(s));
async function readPacks(env) {
  try {
    const d = await gh(env, `/contents/${PACKS_JSON}?ref=${BRANCH}`);
    const text = new TextDecoder().decode(Uint8Array.from(atob(d.content.replace(/\n/g, '')), c => c.charCodeAt(0)));
    const list = JSON.parse(text); return Array.isArray(list) ? list : [];
  } catch (e) { if (/→ 404/.test(e.message)) return []; throw e; }
}
// files: { 'path/in/repo': <base64 string> | null (delete) }
async function commit(env, files, message) {
  const head = (await gh(env, `/git/ref/heads/${BRANCH}`)).object.sha;
  const base = (await gh(env, `/git/commits/${head}`)).tree.sha;
  const tree = [];
  for (const [path, content] of Object.entries(files)) {
    if (content === null) { tree.push({ path, mode: '100644', type: 'blob', sha: null }); continue; }
    const blob = await gh(env, '/git/blobs', { method: 'POST', body: JSON.stringify({ content, encoding: 'base64' }) });
    tree.push({ path, mode: '100644', type: 'blob', sha: blob.sha });
  }
  const t = await gh(env, '/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: base, tree }) });
  const c = await gh(env, '/git/commits', { method: 'POST', body: JSON.stringify({ message, tree: t.sha, parents: [head] }) });
  await gh(env, `/git/refs/heads/${BRANCH}`, { method: 'PATCH', body: JSON.stringify({ sha: c.sha }) });
  return c.sha;
}
const packsBlob = list => utf8b64(JSON.stringify(list, null, 2) + '\n');
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'pack';
const clean = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
const metaList = m => (Array.isArray(m) ? m : String(m || '').split(/[,\s#]+/)).map(x => clean(x, 20).toLowerCase()).filter(Boolean).slice(0, 8);
const okLink = s => { try { const u = new URL(s); return /^https?:$/.test(u.protocol) ? u.href.slice(0, 300) : ''; } catch (e) { return ''; } };

async function addPack(request, env, cors) {
  const form = await request.formData();
  const name = clean(form.get('name'), 60); if (!name) return json({ ok: false, cause: 'Name is required' }, 400, cors);
  const desc = clean(form.get('desc'), 240), meta = metaList(form.get('meta')), link = okLink(form.get('link'));
  const file = form.get('file'), img = form.get('img');
  const hasFile = file && typeof file === 'object' && file.size > 0, hasImg = img && typeof img === 'object' && img.size > 0;
  if (!hasFile && !link) return json({ ok: false, cause: 'Upload the pack .zip or give a download link' }, 400, cors);
  if (hasFile && file.size > MAX_PACK) return json({ ok: false, cause: `Pack is ${(file.size / 1048576).toFixed(1)} MB — limit is 40 MB. Zip it tighter or use a download link.` }, 413, cors);
  if (hasImg && img.size > MAX_IMG) return json({ ok: false, cause: 'Cover image is over 3 MB' }, 413, cors);
  let imgExt = '';
  if (hasImg) { imgExt = ({ 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' })[img.type] || ''; if (!imgExt) return json({ ok: false, cause: 'Cover must be png, jpg, webp or gif' }, 400, cors); }
  const list = await readPacks(env);
  let id = slugify(name), n = 2; while (list.some(p => p.id === id)) id = slugify(name) + '-' + n++;
  const entry = { id, name, desc, meta, added: new Date().toISOString().slice(0, 10) };
  const files = {};
  if (hasFile) { entry.file = `${PACKS_DIR}/${id}.zip`; entry.size = file.size; files[entry.file] = b64(await file.arrayBuffer()); }
  if (link) entry.dl = link;
  if (hasImg) { entry.img = `${PACKS_DIR}/${id}.${imgExt}`; files[entry.img] = b64(await img.arrayBuffer()); }
  list.unshift(entry);
  files[PACKS_JSON] = packsBlob(list);
  const sha = await commit(env, files, `Packs: add ${name} (admin panel)`);
  return json({ ok: true, pack: entry, packs: list, commit: sha }, 200, cors);
}
async function editPack(request, env, cors) {
  let b = {}; try { b = await request.json(); } catch (e) {}
  const list = await readPacks(env), p = list.find(x => x.id === b.id);
  if (!p) return json({ ok: false, cause: 'No such pack' }, 404, cors);
  if (b.name !== undefined) { const nm = clean(b.name, 60); if (nm) p.name = nm; }
  if (b.desc !== undefined) p.desc = clean(b.desc, 240);
  if (b.meta !== undefined) p.meta = metaList(b.meta);
  if (b.link !== undefined) { const l = okLink(b.link); if (l) p.dl = l; else delete p.dl; }
  if (!p.file && !p.dl) return json({ ok: false, cause: 'A pack needs a file or a download link' }, 400, cors);
  const sha = await commit(env, { [PACKS_JSON]: packsBlob(list) }, `Packs: edit ${p.name} (admin panel)`);
  return json({ ok: true, pack: p, packs: list, commit: sha }, 200, cors);
}
async function deletePack(url, env, cors) {
  const id = url.searchParams.get('id') || '';
  const list = await readPacks(env), i = list.findIndex(x => x.id === id);
  if (i < 0) return json({ ok: false, cause: 'No such pack' }, 404, cors);
  const [p] = list.splice(i, 1), files = { [PACKS_JSON]: packsBlob(list) };
  if (p.file) files[p.file] = null;
  if (p.img) files[p.img] = null;
  const sha = await commit(env, files, `Packs: remove ${p.name} (admin panel)`);
  return json({ ok: true, packs: list, commit: sha }, 200, cors);
}

/* ---------- router for /admin/* ---------- */
export async function handleAdmin(request, env, ctx, cors) {
  cors = { ...cors, 'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type' };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  const url = new URL(request.url), route = url.pathname.replace(/^\/admin/, '') || '/';
  if (!env.ADMIN_PASSWORD) return json({ ok: false, cause: 'ADMIN_PASSWORD secret is not set on the worker' }, 503, cors);
  if (route === '/login') return request.method === 'POST' ? login(request, env, cors) : json({ ok: false, cause: 'POST {password}' }, 405, cors);
  if (!(await authed(request, env))) return json({ ok: false, cause: 'Not logged in', login: true }, 401, cors);
  try {
    if (route === '/stats') {
      if (!env.ANALYTICS) return json({ ok: false, cause: 'analytics not configured' }, 503, cors);
      const days = Math.min(365, Math.max(1, parseInt(url.searchParams.get('days'), 10) || 30));
      const r = await doCall(env, `/stats?days=${days}&today=${tehranDay()}`);
      return json({ ok: true, ...(await r.json()) }, 200, cors);
    }
    if (route === '/packs') {
      if (!env.GITHUB_TOKEN) return json({ ok: false, cause: 'GITHUB_TOKEN secret is not set on the worker — packs can\'t be saved yet' }, 503, cors);
      if (request.method === 'GET') return json({ ok: true, packs: await readPacks(env) }, 200, cors);
      if (request.method === 'POST') return addPack(request, env, cors);
      if (request.method === 'PATCH') return editPack(request, env, cors);
      if (request.method === 'DELETE') return deletePack(url, env, cors);
    }
    if (route === '/ping') return json({ ok: true, analytics: !!env.ANALYTICS, github: !!env.GITHUB_TOKEN }, 200, cors);
    return json({ ok: false, cause: 'Unknown admin route' }, 404, cors);
  } catch (e) { return json({ ok: false, cause: String(e.message || e) }, 502, cors); }
}

/* ---------- the Durable Object (SQLite) ---------- */
export class Analytics {
  constructor(state) {
    this.sql = state.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS hits (id INTEGER PRIMARY KEY, ts INTEGER NOT NULL, day TEXT NOT NULL, path TEXT, vid TEXT, country TEXT, ref TEXT, dev TEXT, lang TEXT);
      CREATE INDEX IF NOT EXISTS hits_day ON hits(day);
      CREATE INDEX IF NOT EXISTS hits_ts ON hits(ts);
      CREATE TABLE IF NOT EXISTS fails (ip TEXT NOT NULL, ts INTEGER NOT NULL);`);
  }
  async fetch(request) {
    const url = new URL(request.url), now = Date.now();
    const body = request.method === 'POST' ? await request.json().catch(() => ({})) : {};
    if (url.pathname === '/hit') {
      this.sql.exec('INSERT INTO hits (ts, day, path, vid, country, ref, dev, lang) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', body.ts, body.day, body.path, body.vid, body.country, body.ref, body.dev, body.lang);
      if (Math.random() < 0.01) this.sql.exec('DELETE FROM hits WHERE ts < ?', now - 400 * 86400000);   // keep ~13 months
      return new Response(null, { status: 204 });
    }
    if (url.pathname === '/login-check') {
      this.sql.exec('DELETE FROM fails WHERE ts < ?', now - 15 * 60000);
      const n = this.sql.exec('SELECT COUNT(*) AS n FROM fails WHERE ip = ?', body.ip).one().n;
      return Response.json({ blocked: n >= 8 });
    }
    if (url.pathname === '/login-fail') { this.sql.exec('INSERT INTO fails (ip, ts) VALUES (?, ?)', body.ip, now); return new Response(null, { status: 204 }); }
    if (url.pathname === '/stats') {
      const days = parseInt(url.searchParams.get('days'), 10) || 30, today = url.searchParams.get('today');
      const daily = this.sql.exec('SELECT day, COUNT(*) AS views, COUNT(DISTINCT vid) AS visitors FROM hits GROUP BY day ORDER BY day').toArray();
      const byDay = Object.fromEntries(daily.map(d => [d.day, d]));
      const series = [];
      const t = new Date(today + 'T12:00:00Z');   // walk back `days` calendar days, ending today
      for (let i = days - 1; i >= 0; i--) { const d = new Date(t.getTime() - i * 86400000).toISOString().slice(0, 10); const row = byDay[d]; series.push({ day: d, views: row ? row.views : 0, visitors: row ? row.visitors : 0 }); }
      const all = daily.reduce((a, r) => ({ views: a.views + r.views, visitors: a.visitors + r.visitors }), { views: 0, visitors: 0 });
      const totals = {
        today: byDay[today] ? { views: byDay[today].views, visitors: byDay[today].visitors } : { views: 0, visitors: 0 },
        all, firstDay: daily.length ? daily[0].day : null,
        live: this.sql.exec('SELECT COUNT(DISTINCT vid) AS n FROM hits WHERE ts > ?', now - 30 * 60000).one().n,
      };
      // 7/30-day windows come from the full daily table, whatever range the chart asked for
      const win = n => { const from = new Date(t.getTime() - (n - 1) * 86400000).toISOString().slice(0, 10); return daily.filter(d => d.day >= from).reduce((a, r) => ({ views: a.views + r.views, visitors: a.visitors + r.visitors }), { views: 0, visitors: 0 }); };
      totals.d7 = win(7); totals.d30 = win(30);
      const from = series[0].day;
      const top = (col, n = 10) => this.sql.exec(`SELECT ${col} AS k, COUNT(*) AS views, COUNT(DISTINCT vid) AS visitors FROM hits WHERE day >= ? AND ${col} != '' GROUP BY ${col} ORDER BY visitors DESC, views DESC LIMIT ${n}`, from).toArray();
      return Response.json({ days, today, series, totals, pages: top('path'), countries: top('country'), referrers: top('ref'), devices: top('dev', 3), languages: top('lang', 6) });
    }
    return new Response('not found', { status: 404 });
  }
}
