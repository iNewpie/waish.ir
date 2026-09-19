/* ============================================================
   TOOLS — shared bits for the tool apps (Hypixel Tools folder, Notepad, CPS Test).
   Language (from the site's waish-lang setting), formatting, the proxy URL (same rule as lookup.html),
   stat tiles with the value fitter, player / guild fetchers and BedWars maths.
   Load before the page's own script:  <script src="tools.js?v=…"></script>
   ============================================================ */
window.TOOLS = (() => {
  const WORKER = 'https://waish-proxy.danesh2242.workers.dev';   // tools/proxy.worker.js on Cloudflare
  const STATIC_HOST = location.protocol === 'file:' || /(^|\.)(waish\.ir|github\.io|pages\.dev|netlify\.app|vercel\.app)$/.test(location.hostname);
  const PROXY_DEFAULT = STATIC_HOST ? WORKER : (WORKER && !/^(localhost|127\.0\.0\.1|155\.117\.127\.81)$/.test(location.hostname) ? WORKER : '/api');
  const PROXY_URL = (new URLSearchParams(location.search).get('proxy') || PROXY_DEFAULT).replace(/\/$/, '');

  /* ---------- language ---------- */
  let lang = 'en'; try { lang = localStorage.getItem('waish-lang') === 'fa' ? 'fa' : 'en'; } catch (e) {}
  const fa = lang === 'fa';
  const DICT = {};
  const t = s => (fa && DICT[s]) ? DICT[s] : s;
  const addFA = d => Object.assign(DICT, d);
  // call once the page's dictionary is registered: flips the document to Persian and swaps every data-t / data-tp label
  const applyLang = () => {
    if (!fa) return;
    document.body.classList.add('fa'); document.documentElement.dir = 'rtl'; document.documentElement.lang = 'fa';
    document.querySelectorAll('[data-t]').forEach(el => el.textContent = t(el.dataset.t));
    document.querySelectorAll('[data-tp]').forEach(el => el.placeholder = t(el.dataset.tp));
    document.querySelectorAll('[data-tt]').forEach(el => el.title = t(el.dataset.tt));
  };

  /* ---------- formatting ---------- */
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const fmtN = n => (n == null || n === '' || isNaN(n)) ? '—' : Number(n).toLocaleString(fa ? 'fa-IR' : 'en-US');
  const faDigits = s => fa ? String(s).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]) : String(s);
  const R = (a, b) => ((a || 0) / Math.max(1, b || 0));
  const R2 = (a, b) => R(a, b).toFixed(2);
  const dt = ts => ts ? new Date(ts).toLocaleDateString(fa ? 'fa-IR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const head = (uuid, size = 32) => `https://mc-heads.net/avatar/${uuid}/${size}`;

  /* ---------- Hypixel colours + BedWars maths (same as apps/hypixel-stats.js) ---------- */
  const MC = { BLACK: '#000', DARK_BLUE: '#00A', DARK_GREEN: '#0A0', DARK_AQUA: '#0AA', DARK_RED: '#A00', DARK_PURPLE: '#A0A', GOLD: '#FA0', GRAY: '#AAA', DARK_GRAY: '#555', BLUE: '#55F', GREEN: '#5F5', AQUA: '#5FF', RED: '#F55', LIGHT_PURPLE: '#F5F', YELLOW: '#FF5', WHITE: '#FFF' };
  const READABLE = { '#000': '#666', '#00A': '#5C7CFF', '#0A0': '#4CDB4C', '#0AA': '#33D6D6', '#A00': '#FF5C5C', '#A0A': '#E066FF', '#555': '#9A9A9A' };
  const vivid = c => READABLE[c] || c;
  const starColor = s => vivid(s < 100 ? '#AAA' : s < 200 ? '#FFF' : s < 300 ? '#FA0' : s < 400 ? '#5FF' : s < 500 ? '#0A0' : s < 600 ? '#0AA' : s < 700 ? '#A00' : s < 800 ? '#F5F' : s < 900 ? '#55F' : s < 1000 ? '#A0A' : '#FF5');
  const netLevel = exp => Math.max(1, (Math.sqrt(2 * (exp || 0) + 30625) / 50) - 2.5);
  const bwLevel = exp => { exp = exp || 0; const p = Math.floor(exp / 487000); exp -= p * 487000; let l; if (exp < 500) l = exp / 500; else if (exp < 1500) l = 1 + (exp - 500) / 1000; else if (exp < 3500) l = 2 + (exp - 1500) / 2000; else if (exp < 7000) l = 3 + (exp - 3500) / 3500; else l = 4 + (exp - 7000) / 5000; return p * 100 + l; };
  // total XP needed to *reach* a star (the start of it)
  const xpForStar = s => { s = Math.max(0, Math.floor(s)); const p = Math.floor(s / 100), l = s % 100; const first = [0, 500, 1500, 3500, 7000]; return p * 487000 + (l < 5 ? first[l] : 7000 + (l - 4) * 5000); };
  const xpForNextStar = s => xpForStar(s + 1) - xpForStar(s);
  const guildLevel = exp => { const T = [100000, 150000, 250000, 500000, 750000, 1000000, 1250000, 1500000, 2000000, 2500000, 2500000, 2500000, 2500000, 2500000, 3000000]; let lvl = 0; exp = exp || 0; for (let i = 0; ; i++) { const need = i < T.length ? T[i] : 3000000; if (exp < need) return lvl + exp / need; exp -= need; lvl++; } };
  const PRESTIGES = [['Stone', '#AAA'], ['Iron', '#FFF'], ['Gold', '#FA0'], ['Diamond', '#5FF'], ['Emerald', '#0A0'], ['Sapphire', '#0AA'], ['Ruby', '#A00'], ['Crystal', '#F5F'], ['Opal', '#55F'], ['Amethyst', '#A0A'], ['Rainbow', 'rainbow'], ['Iron Prime', '#FFF'], ['Gold Prime', '#FA0'], ['Diamond Prime', '#5FF'], ['Emerald Prime', '#0A0'], ['Sapphire Prime', '#0AA'], ['Ruby Prime', '#A00'], ['Crystal Prime', '#F5F'], ['Opal Prime', '#55F'], ['Amethyst Prime', '#A0A'], ['Mirror', '#AAA'], ['Light', '#FFF'], ['Dawn', '#FA0'], ['Dusk', '#A0A'], ['Air', '#5FF'], ['Wind', '#5F5'], ['Nebula', '#A00'], ['Thunder', '#FF5'], ['Earth', '#0A0'], ['Water', '#55F'], ['Fire', '#FA0']];
  const prestige = star => { const i = Math.floor(star / 100); const p = PRESTIGES[Math.min(i, PRESTIGES.length - 1)]; return { index: i, name: i < PRESTIGES.length ? p[0] : `Prestige ${i}`, color: p[1] === 'rainbow' ? 'rainbow' : vivid(p[1]), start: i * 100 }; };
  // FKDR tiers, same thresholds as User Lookup
  const fkdrTier = f => { f = +f; return f >= 1000 ? 'fk fk-god' : f >= 100 ? 'fk fk-rainbow' : f >= 60 ? 'fk fk-aqua' : f >= 30 ? 'fk fk-purple' : f >= 10 ? 'fk fk-red' : f >= 7 ? 'fk fk-yellow' : f >= 3 ? 'fk fk-green' : f >= 1 ? 'fk fk-white' : 'fk fk-gray'; };
  const rankOf = pl => {
    if (!pl) return null;
    if (pl.prefix) return { name: pl.prefix.replace(/§./g, '').replace(/[\[\]]/g, ''), color: '#F55' };
    const r = pl.rank && !['NORMAL', 'NONE'].includes(pl.rank) ? pl.rank : null;
    if (r) return { ADMIN: { name: 'ADMIN', color: '#F55' }, GAME_MASTER: { name: 'GM', color: vivid('#0A0') }, MODERATOR: { name: 'MOD', color: vivid('#0A0') }, YOUTUBER: { name: 'YOUTUBE', color: '#F55' } }[r] || { name: r, color: '#F55' };
    if (pl.monthlyPackageRank === 'SUPERSTAR') return { name: 'MVP++', color: pl.monthlyRankColor === 'AQUA' ? '#5FF' : '#FA0' };
    const pk = (pl.newPackageRank && pl.newPackageRank !== 'NONE') ? pl.newPackageRank : pl.packageRank;
    return { VIP: { name: 'VIP', color: '#5F5' }, VIP_PLUS: { name: 'VIP+', color: '#5F5' }, MVP: { name: 'MVP', color: '#5FF' }, MVP_PLUS: { name: 'MVP+', color: '#5FF' } }[pk] || null;
  };
  const bwStar = pl => (pl && pl.achievements && pl.achievements.bedwars_level) || (pl && pl.stats && pl.stats.Bedwars && pl.stats.Bedwars.Experience != null ? Math.floor(bwLevel(pl.stats.Bedwars.Experience)) : null);

  /* ---------- stat tiles (same markup as User Lookup) + the value fitter ---------- */
  const stat = (k, v, hi, color, cls) => (v == null || v === '' || v === 'NaN') ? '' : `<div class="stat${hi ? ' hi' : ''}${cls ? ' ' + cls : ''}"><div class="k">${esc(k)}</div><div class="v"${color ? ` style="color:${color}"` : ''}>${v}</div></div>`;
  const tiles = cells => { const c = cells.filter(Boolean); return c.length ? `<div class="tiles">${c.join('')}</div>` : ''; };
  const fitStats = () => {
    document.querySelectorAll('.stat .v').forEach(v => {
      v.style.fontSize = ''; v.classList.remove('tight');
      const w = v.clientWidth; if (!w) return;
      let fs = parseFloat(getComputedStyle(v).fontSize);
      while (v.scrollWidth > w + 1 && fs > 11) { fs -= 1; v.style.fontSize = fs + 'px'; }
      if (v.scrollWidth > w + 1) v.classList.add('tight');
    });
  };
  let fitRaf = 0; const fitSoon = () => { cancelAnimationFrame(fitRaf); fitRaf = requestAnimationFrame(fitStats); };
  addEventListener('DOMContentLoaded', () => { new MutationObserver(fitSoon).observe(document.body, { childList: true, subtree: true }); fitSoon(); });
  addEventListener('resize', fitSoon);

  /* ---------- fetching (through the proxy worker; see tools/proxy.worker.js) ---------- */
  const NAME_RE = /^[A-Za-z0-9_]{1,16}$/, UUID_RE = /^[0-9a-f]{32}$/;
  const err = (msg, code) => { const e = new Error(msg); e.code = code; return e; };
  const jsonOf = async r => { try { return await r.json(); } catch (e) { return null; } };
  // name or uuid → { uuid (undashed), name }
  async function profile(q) {
    q = String(q || '').trim().replace(/-/g, ''); if (!q) throw err(t('Type a username.'), 'empty');
    if (!NAME_RE.test(q) && !UUID_RE.test(q.toLowerCase())) throw err(t('Not a valid username or UUID.'), 'invalid');
    if (!PROXY_URL) throw err(t('Not connected to the proxy.'), 'proxy');
    const r = await fetch(`${PROXY_URL}/convert?player=${encodeURIComponent(q)}`); const d = await jsonOf(r);
    if (r.status === 404 || (d && /not found/i.test(d.cause || ''))) throw err(t('Player not found.'), 'notfound');
    if (r.status === 429) throw err(t('Mojang is rate limited — try again in a minute.'), 'busy');
    if (!d || !d.success || !d.uuid) throw err(t('Lookup failed — try again in a moment.'), 'failed');
    return { uuid: String(d.uuid).replace(/-/g, '').toLowerCase(), name: d.ign || q };
  }
  // uuid → Hypixel player object (Bordic's cache through the worker)
  async function player(uuid) {
    const r = await fetch(`${PROXY_URL}/player?uuid=${uuid}`, { cache: 'no-store' }); const d = await jsonOf(r);
    if (r.status === 429) throw err(t('Hypixel data is busy — try again in a minute.'), 'busy');
    if (r.status === 404 || (d && /no data/i.test(d.cause || ''))) throw err(t('No Hypixel stats for this player yet.'), 'nodata');
    if (!d || !d.success) throw err(`${t('Hypixel check failed.')} ${(d && (d.cause || d.error)) || r.status || ''}`.trim(), 'failed');
    if (!d.player) throw err(t('Never joined Hypixel.'), 'never');
    return d.player;
  }
  // full player by name or uuid: { uuid, name, player }
  async function lookup(q) { const p = await profile(q); const pl = await player(p.uuid); return { ...p, name: pl.displayname || p.name, player: pl }; }
  async function guild(params) {   // params: 'name=…' or 'uuid=…'
    if (!PROXY_URL) throw err(t('Not connected to the proxy.'), 'proxy');
    const r = await fetch(`${PROXY_URL}/guild?${params}`); const d = await jsonOf(r);
    if (r.status === 429) throw err(t('Hypixel is busy — try again in a minute.'), 'busy');
    if (!d || !d.success) throw err(`${t('Guild lookup failed.')} ${(d && (d.cause || d.error)) || r.status || ''}`.trim(), 'failed');
    if (!d.guild) throw err(t('Guild not found.'), 'notfound');
    return d.guild;
  }
  // uuid → name for many uuids, 40 per worker call; onEach(uuid, name) fires as they arrive. Cached in localStorage.
  let NAMES = {}; try { NAMES = JSON.parse(localStorage.getItem('waish-names') || '{}'); } catch (e) {}
  async function names(uuids, onEach) {
    uuids = [...new Set(uuids.map(u => String(u).replace(/-/g, '').toLowerCase()))];
    const todo = []; uuids.forEach(u => { if (NAMES[u]) onEach(u, NAMES[u]); else todo.push(u); });
    const chunks = []; for (let i = 0; i < todo.length; i += 40) chunks.push(todo.slice(i, i + 40));
    await Promise.all(chunks.map(async c => {
      let got = {}; try { const r = await fetch(`${PROXY_URL}/names?uuids=${c.join(',')}`); const d = await jsonOf(r); got = (d && d.names) || {}; } catch (e) {}
      c.forEach(u => { if (got[u]) NAMES[u] = got[u]; onEach(u, got[u] || null); });
    }));
    try { const ks = Object.keys(NAMES); if (ks.length > 2500) ks.slice(0, ks.length - 2500).forEach(k => delete NAMES[k]); localStorage.setItem('waish-names', JSON.stringify(NAMES)); } catch (e) {}
  }
  // "[MVP+] Name" header bits
  const nameHTML = pl => { const r = rankOf(pl); const n = esc(pl.displayname || '?'); return r ? `<span style="color:${r.color}">[${esc(r.name)}]</span> <span style="color:${r.color}">${n}</span>` : `<span style="color:#AAA">${n}</span>`; };
  // recent inputs (per app key), newest first
  const recent = key => ({ get() { try { return JSON.parse(localStorage.getItem('waish-recent-' + key) || '[]'); } catch (e) { return []; } }, add(v) { const l = this.get().filter(x => x.toLowerCase() !== v.toLowerCase()); l.unshift(v); try { localStorage.setItem('waish-recent-' + key, JSON.stringify(l.slice(0, 8))); } catch (e) {} } });

  addFA({ 'Type a username.': 'یه یوزرنیم بنویس.', 'Not a valid username or UUID.': 'یوزرنیم یا UUID معتبر نیست.', 'Not connected to the proxy.': 'به پروکسی وصل نیست.', 'Player not found.': 'بازیکن پیدا نشد.', 'Mojang is rate limited — try again in a minute.': 'Mojang محدودیت درخواست داره — یه دقیقه دیگه دوباره تلاش کن.', 'Lookup failed — try again in a moment.': 'جستجو ناموفق بود — یه لحظه دیگه دوباره تلاش کن.', 'Hypixel data is busy — try again in a minute.': 'دادهٔ هایپیکسل شلوغه — یه دقیقه دیگه دوباره تلاش کن.', 'No Hypixel stats for this player yet.': 'هنوز آماری از این بازیکن توی هایپیکسل نیست.', 'Hypixel check failed.': 'بررسی هایپیکسل ناموفق بود.', 'Never joined Hypixel.': 'هیچ‌وقت وارد هایپیکسل نشده.', 'Hypixel is busy — try again in a minute.': 'هایپیکسل شلوغه — یه دقیقه دیگه دوباره تلاش کن.', 'Guild lookup failed.': 'جستجوی گیلد ناموفق بود.', 'Guild not found.': 'گیلد پیدا نشد.', 'Look up': 'جستجو', 'loading…': 'در حال بارگذاری…', 'recent': 'اخیر', 'Load from username': 'از روی یوزرنیم', 'username': 'یوزرنیم' });

  return { PROXY_URL, lang, fa, t, addFA, applyLang, $, esc, fmtN, faDigits, R, R2, dt, head, MC, vivid, starColor, netLevel, bwLevel, xpForStar, xpForNextStar, guildLevel, PRESTIGES, prestige, fkdrTier, rankOf, bwStar, stat, tiles, fitStats, fitSoon, profile, player, lookup, guild, names, nameHTML, recent };
})();
