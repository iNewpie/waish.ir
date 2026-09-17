/* ============================================================
   GUILD LOOKUP — third tab of lookup.html.
   Search a Hypixel guild by its name, or by a player who is in it, and show the guild's
   level, XP, members (grouped by rank, names resolved from UUIDs), weekly activity,
   ranks, preferred games and XP per game.
   Relies on globals from lookup.html: $, t, esc, fmtN, lang, PROXY_URL, profile(), lookup().
   Uses HYP (hypixel-stats.js) for level maths, colours and game names.
   ============================================================ */
window.GUILD = (() => {
  const fa = () => lang === 'fa';
  const dt = ts => ts ? new Date(ts).toLocaleDateString(fa() ? 'fa-IR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const N = v => v == null ? '—' : fmtN(v);
  const stat = (k, v, hi, color) => (v == null || v === '') ? '' : `<div class="stat${hi ? ' hi' : ''}"><div class="k">${esc(k)}</div><div class="v"${color ? ` style="color:${color}"` : ''}>${v}</div></div>`;
  const grid = cells => `<div class="bw">${cells.filter(Boolean).join('')}</div>`;
  const section = (title, inner) => inner ? `<div class="hy-sec"><div class="hy-title">${esc(title)}</div>${inner}</div>` : '';
  const T = { name: fa() ? 'اسم گیلد' : 'Guild name', player: fa() ? 'بازیکن' : 'Player', level: fa() ? 'لول' : 'level', members: fa() ? 'اعضا' : 'members', created: fa() ? 'ساخته‌شده' : 'created', weekly: fa() ? 'XP هفتگی' : 'weekly XP', quests: fa() ? 'کوئست‌ها' : 'quest participation', listed: fa() ? 'عمومی' : 'publicly listed', yes: fa() ? 'بله' : 'yes', no: fa() ? 'نه' : 'no', games: fa() ? 'بازی‌های ترجیحی' : 'preferred games', xpByGame: fa() ? 'XP به ازای بازی' : 'XP by game', ranks: fa() ? 'رنک‌ها' : 'ranks', memberList: fa() ? 'اعضا' : 'members', joined: fa() ? 'عضویت' : 'joined', more: fa() ? 'نمایش بیشتر' : 'show more', notFound: fa() ? 'گیلدی پیدا نشد.' : 'No guild found.', noGuild: fa() ? 'این بازیکن توی گیلدی نیست.' : 'This player is not in a guild.', failed: fa() ? 'جستجو ناموفق بود — یه لحظه دیگه دوباره تلاش کن.' : 'Lookup failed — try again in a moment.', looking: fa() ? 'در حال جستجو' : 'looking up', notConnected: fa() ? 'جستجوی گیلد هنوز وصل نشده: PROXY_DEFAULT رو بالای apps/lookup.html روی پروکسی‌ت بذار.' : 'Guild lookup is not connected yet: set PROXY_DEFAULT at the top of apps/lookup.html to your proxy worker.', achievements: fa() ? 'دستاوردها' : 'achievements', online: fa() ? 'رکورد آنلاین' : 'online record', winners: fa() ? 'بردها' : 'winners', expKings: fa() ? 'XP kings' : 'experience kings' };

  /* ---------- UUID → name cache ----------
     Names come from Mojang through the proxy (/names, up to 40 uuids per call; /convert for one). Without a proxy,
     or if it answers nothing, PlayerDB / Ashcon stand in. ---------- */
  let NAMES = {}; try { NAMES = JSON.parse(localStorage.getItem('waish-names') || '{}'); } catch (e) {}
  const saveNames = () => { try { const ks = Object.keys(NAMES); if (ks.length > 2500) ks.slice(0, ks.length - 2500).forEach(k => delete NAMES[k]); localStorage.setItem('waish-names', JSON.stringify(NAMES)); } catch (e) {} };
  async function resolveName(uuid) {
    if (NAMES[uuid]) return NAMES[uuid];
    if (PROXY_URL) { try { const r = await fetch(`${PROXY_URL}/convert?player=${uuid}`); const d = await r.json(); if (d && d.success && d.ign) { NAMES[uuid] = d.ign; return d.ign; } } catch (e) {} }
    try { const r = await fetch(`https://playerdb.co/api/player/minecraft/${uuid}`); const d = await r.json(); const n = d && d.data && d.data.player && d.data.player.username; if (n) { NAMES[uuid] = n; return n; } } catch (e) {}
    try { const r = await fetch(`https://api.ashcon.app/mojang/v2/user/${uuid}`); const d = await r.json(); if (d && d.username) { NAMES[uuid] = d.username; return d.username; } } catch (e) {}
    return null;
  }
  async function resolveBordic(uuids) {   // one worker call → { uuid: name | null }
    if (!PROXY_URL || !uuids.length) return {};
    try { const r = await fetch(`${PROXY_URL}/names?uuids=${uuids.join(',')}`); const d = await r.json(); return (d && d.success && d.names) || {}; } catch (e) { return {}; }
  }
  async function resolveBatch(uuids, onEach) {
    const todo = uuids.filter(u => !NAMES[u]); uuids.filter(u => NAMES[u]).forEach(u => onEach(u, NAMES[u]));
    const chunks = []; for (let i = 0; i < todo.length; i += 40) chunks.push(todo.slice(i, i + 40));
    const missing = [];
    await Promise.all(chunks.map(async c => { const got = await resolveBordic(c); c.forEach(u => { if (got[u]) { NAMES[u] = got[u]; onEach(u, got[u]); } else missing.push(u); }); }));
    const workers = Array.from({ length: 6 }, async () => { while (missing.length) { const u = missing.shift(); const n = await resolveName(u); onEach(u, n); } });
    await Promise.all(workers); saveNames();
  }

  /* ---------- fetching ---------- */
  async function fetchGuild(params) {   // worker /guild → official Hypixel API (needs the HYPIXEL_KEY secret on the worker)
    if (!PROXY_URL) return null;
    const r = await fetch(`${PROXY_URL}/guild?${params}`); return { r, d: await r.json().catch(() => null) };
  }

  /* ---------- state + render ---------- */
  const ST = { g: null, shown: 40, byPlayer: false };
  const out = () => $('#gResult'), msg = () => $('#gMsg');
  const weekly = m => (m.expHistory ? Object.values(m.expHistory).reduce((a, b) => a + (b || 0), 0) : 0);
  function render() {
    const g = ST.g, H = window.HYP; if (!g) return;
    const color = H.vivid(H.MC[g.tagColor] || '#AAA'), lvl = H.guildLevel(g.exp), pct = Math.round((lvl % 1) * 100);
    const members = (g.members || []).slice(), rankPri = Object.fromEntries((g.ranks || []).map(r => [r.name, r.priority]));
    const pri = m => m.rank === 'Guild Master' || m.rank === 'GUILDMASTER' ? 999 : (rankPri[m.rank] != null ? rankPri[m.rank] : 0);
    members.sort((a, b) => pri(b) - pri(a) || weekly(b) - weekly(a));
    const totalWeekly = members.reduce((a, m) => a + weekly(m), 0), totalQuests = members.reduce((a, m) => a + (m.questParticipation || 0), 0);
    const ach = g.achievements || {};
    const byGame = Object.entries(g.guildExpByGameType || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]); const maxXp = byGame.length ? byGame[0][1] : 1;
    let html = `<div class="ghead"><div class="gname" style="color:${color}">${esc(g.name)}${g.tag ? ` <span class="gtag">[${esc(g.tag)}]</span>` : ''}</div>${g.description ? `<p class="gdesc">${esc(g.description)}</p>` : ''}</div>
      <div class="lvl"><div class="lvl-bar"><i style="width:${pct}%"></i></div><span>${T.level} <b>${fmtN(Math.floor(lvl))}</b> · ${fmtN(pct)}% → ${fmtN(Math.floor(lvl) + 1)}</span></div>
      ${grid([stat(T.level, fmtN(Math.floor(lvl)), true, '#FA0'), stat('XP', N(g.exp)), stat(T.members, N(members.length) + ' / 125'), stat(T.weekly, N(totalWeekly), true), stat(T.quests, N(totalQuests)), stat(T.created, dt(g.created)), stat(T.listed, g.publiclyListed ? T.yes : T.no), ach.ONLINE_PLAYERS != null ? stat(T.online, N(ach.ONLINE_PLAYERS)) : '', ach.WINNERS != null ? stat(T.winners, N(ach.WINNERS)) : '', ach.EXPERIENCE_KINGS != null ? stat(T.expKings, N(ach.EXPERIENCE_KINGS)) : ''])}`;
    if (g.preferredGames && g.preferredGames.length) html += `<div class="row"><span class="k">${T.games}</span><span class="tags">${g.preferredGames.map(x => `<span class="tag">${esc(H.GAME_NAMES[x] || x)}</span>`).join('')}</span></div>`;
    if (byGame.length) html += section(T.xpByGame, `<div class="xpbars">${byGame.slice(0, 10).map(([k, v]) => `<div class="xprow"><span class="xpn">${esc(H.GAME_NAMES[k] || k)}</span><div class="xpbar"><i style="width:${Math.max(2, Math.round(100 * v / maxXp))}%"></i></div><span class="xpv">${N(v)}</span></div>`).join('')}</div>`);
    if (g.ranks && g.ranks.length) html += section(T.ranks, `<div class="tags">${[{ name: 'Guild Master', priority: 999, tag: 'GM' }].concat(g.ranks.slice().sort((a, b) => b.priority - a.priority)).map(r => `<span class="tag${r.default ? ' info' : ''}" title="priority ${r.priority}">${esc(r.name)}${r.tag ? ` · ${esc(r.tag)}` : ''}</span>`).join('')}</div>`);
    // members grouped by rank
    const groups = []; members.forEach(m => { const last = groups[groups.length - 1]; if (last && last.rank === m.rank) last.list.push(m); else groups.push({ rank: m.rank, list: [m] }); });
    let count = 0, memberHTML = '';
    for (const grp of groups) {
      if (count >= ST.shown) break;
      const slice = grp.list.slice(0, ST.shown - count); count += slice.length;
      memberHTML += `<div class="mgroup"><div class="mg-title">${esc(grp.rank)} <span>${fmtN(grp.list.length)}</span></div>${slice.map(m => `<button class="member" data-uuid="${esc(m.uuid)}" title="${T.joined} ${dt(m.joined)}"><img src="https://mc-heads.net/avatar/${esc(m.uuid)}/24" alt="" loading="lazy" width="24" height="24"><span class="mname" data-uuid="${esc(m.uuid)}">${NAMES[m.uuid] ? esc(NAMES[m.uuid]) : '…'}</span><span class="mxp">${N(weekly(m))} xp</span></button>`).join('')}</div>`;
    }
    html += section(`${T.memberList} · ${fmtN(members.length)}`, memberHTML + (count < members.length ? `<button class="abtn sm" id="gMore">${T.more} (${fmtN(members.length - count)})</button>` : ''));
    out().innerHTML = html; out().classList.add('on');
    const more = $('#gMore'); if (more) more.addEventListener('click', () => { ST.shown += 40; render(); });
    out().querySelectorAll('.member').forEach(b => b.addEventListener('click', () => { const n = NAMES[b.dataset.uuid]; if (n) { $('#tabs [data-tab="user"]').click(); $('#q').value = n; lookup(n); } }));
    // resolve names for the visible members that are still unknown
    const pending = [...out().querySelectorAll('.mname')].map(el => el.dataset.uuid).filter(u => !NAMES[u]);
    if (pending.length) resolveBatch(pending, (u, n) => { out().querySelectorAll(`.mname[data-uuid="${u}"]`).forEach(el => el.textContent = n || u.slice(0, 8)); });
  }

  async function search(q, byPlayer) {
    q = (q || '').trim(); if (!q) return;
    ST.byPlayer = !!byPlayer; out().classList.remove('on'); out().innerHTML = '';
    if (!PROXY_URL) { msg().className = 'msg'; msg().textContent = T.notConnected; msg().hidden = false; return; }
    msg().className = 'msg'; msg().innerHTML = `<span class="spin"></span>${T.looking} <b>${esc(q)}</b>…`; msg().hidden = false;
    try {
      let params;
      if (byPlayer) { const p = await profile(q); params = `player=${p.undashed}`; } else params = `name=${encodeURIComponent(q)}`;
      const res = await fetchGuild(params);
      if (!res || !res.d || !res.d.success) throw new Error((res && res.d && (res.d.cause || res.d.error)) || 'failed');
      if (!res.d.guild) { msg().className = 'msg err'; msg().textContent = byPlayer ? T.noGuild : T.notFound; return; }
      ST.g = res.d.guild; ST.shown = 40; msg().hidden = true; render();
    } catch (e) { msg().className = 'msg err'; msg().textContent = e.message === 'notfound' ? (fa() ? 'بازیکن پیدا نشد.' : 'Player not found.') : T.failed; }
  }
  function setMode(byPlayer) { ST.byPlayer = byPlayer; document.querySelectorAll('#gMode button').forEach(b => b.classList.toggle('on', (b.dataset.m === 'player') === byPlayer)); $('#gQ').placeholder = byPlayer ? (fa() ? 'یوزرنیم بازیکن…' : 'Player username…') : (fa() ? 'اسم گیلد…' : 'Guild name…'); }
  function init() {
    $('#gForm').addEventListener('submit', e => { e.preventDefault(); search($('#gQ').value, ST.byPlayer); });
    $('#gMode').addEventListener('click', e => { const m = e.target.dataset.m; if (m) setMode(m === 'player'); });
    try { localStorage.removeItem('waish-guild-history'); } catch (e) {}   // recent-search chips were removed; drop what older visits stored
  }
  return { search, init, setMode, open(name) { $('#tabs [data-tab="guild"]').click(); $('#gQ').value = name; setMode(false); search(name, false); } };
})();
