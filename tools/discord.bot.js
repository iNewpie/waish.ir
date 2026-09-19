/* ============================================================
   WAISH DISCORD BOT — slash commands answered by the proxy worker (tools/proxy.worker.js).
   No always-on process: Discord POSTs every command to <worker-url>/discord, the worker answers and goes back to sleep.
   Free on the Workers free plan (100,000 requests/day).

   Hypixel Tools commands (/compare /prestige /ratio /leaderboard /status) mirror the site's apps in apps/*.html.
   The lookup commands reuse the worker's own routes (/convert, /urchin, /player, /guild, /mojang), so the bot and the
   site terminal (/check on waish.ir) give the same answer from the same code.

   SETUP
     1. discord.com/developers/applications → your app → General Information: copy Application ID + Public Key
        into tools/proxy.env as DISCORD_APP_ID / DISCORD_PUBLIC_KEY (the Bot token goes in as DISCORD_BOT_TOKEN, only
        the register script needs it). `bash tools/deploy-worker.sh` puts them on the worker as secrets.
     2. `bash tools/discord-register.sh` — registers the slash commands in tools/discord-commands.json (global, instant).
     3. App → General Information → Interactions Endpoint URL = <worker-url>/discord → Save (Discord sends a PING to verify).
     Image replies: set RENDER_URL + RENDER_KEY (tools/bot-render/server.mjs on the VPS); without them the bot answers with text embeds.
   4. Install: https://discord.com/oauth2/authorize?client_id=<app id> — offers "Add to server" and "Add to my apps" (user install:
        the commands then work for that person in every server and in DMs; enabled in the portal under Installation).
   ============================================================ */
const SITE = 'https://waish.ir';
const INVITE = 'https://discord.gg/8HVsMqucZ2';
const APP_ID = '1550598910240620574';
const SERAPH_KEY = 'cac7921b-ef85-498f-81c6-7675300a3cd6';   // the same public key the site terminal uses
const COLOR = { red: 0xff5f57, green: 0x3ddc84, yellow: 0xffbd2e, blue: 0x5b9dff, grey: 0x8b95a7 };
const hex = s => Uint8Array.from(s.match(/.{2}/g), b => parseInt(b, 16));

// Ed25519 check Discord requires on every interaction — anything unsigned is dropped with 401.
async function verify(request, body, env) {
  const sig = request.headers.get('X-Signature-Ed25519'), ts = request.headers.get('X-Signature-Timestamp');
  if (!sig || !ts || !env.DISCORD_PUBLIC_KEY) return false;
  try {
    const key = await crypto.subtle.importKey('raw', hex(env.DISCORD_PUBLIC_KEY), { name: 'Ed25519' }, false, ['verify']);
    return await crypto.subtle.verify('Ed25519', key, hex(sig), new TextEncoder().encode(ts + body));
  } catch (e) { return false; }
}

const reply = (data, ephemeral) => new Response(JSON.stringify({ type: 4, data: { ...data, ...(ephemeral ? { flags: 64 } : {}) } }), { headers: { 'Content-Type': 'application/json' } });
const btn = (label, url, emoji) => ({ type: 2, style: 5, label, url, ...(emoji ? { emoji: { name: emoji } } : {}) });
const row = (...buttons) => ({ type: 1, components: buttons });
const footer = { text: 'waish.ir', icon_url: `${SITE}/assets/avatar.jpg` };
const clean = s => String(s || '').replace(/\(\s*upgraded\s*\)/gi, '').replace(/^\s*legacy\s*-\s*/i, '').replace(/\s{2,}/g, ' ').trim();
const title = s => String(s || 'tag').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const n = v => v == null ? '—' : Math.round(v).toLocaleString('en-US');
const ratio = (a, b) => ((a || 0) / Math.max(1, b || 0)).toFixed(2);
// the same formulas as apps/hypixel-stats.js
const netLevel = exp => Math.max(1, (Math.sqrt(2 * (exp || 0) + 30625) / 50) - 2.5);
const bwLevel = exp => { exp = exp || 0; const p = Math.floor(exp / 487000); exp -= p * 487000; let l; if (exp < 500) l = exp / 500; else if (exp < 1500) l = 1 + (exp - 500) / 1000; else if (exp < 3500) l = 2 + (exp - 1500) / 2000; else if (exp < 7000) l = 3 + (exp - 3500) / 3500; else l = 4 + (exp - 7000) / 5000; return p * 100 + l; };
const guildLevel = exp => { const T = [100000, 150000, 250000, 500000, 750000, 1000000, 1250000, 1500000, 2000000, 2500000, 2500000, 2500000, 2500000, 2500000, 3000000]; let lvl = 0; exp = exp || 0; for (let i = 0; ; i++) { const need = i < T.length ? T[i] : 3000000; if (exp < need) return lvl + exp / need; exp -= need; lvl++; } };
function rankOf(pl) {
  if (pl.prefix) return pl.prefix.replace(/§./g, '').replace(/[\[\]]/g, '');
  const r = pl.rank && !['NORMAL', 'NONE'].includes(pl.rank) ? pl.rank : null;
  if (r) return { GAME_MASTER: 'GM', MODERATOR: 'MOD', YOUTUBER: 'YOUTUBE' }[r] || r;
  if (pl.monthlyPackageRank === 'SUPERSTAR') return 'MVP++';
  const pk = (pl.newPackageRank && pl.newPackageRank !== 'NONE') ? pl.newPackageRank : pl.packageRank;
  return { VIP: 'VIP', VIP_PLUS: 'VIP+', MVP: 'MVP', MVP_PLUS: 'MVP+' }[pk] || null;
}
const lobbyName = (pl, fallback) => { const r = rankOf(pl); return `${r ? `[${r}] ` : ''}${pl.displayname || fallback}`; };
// Hypixel colours, lifted a little so they read on the card's dark background (same as apps/hypixel-stats.js)
const MC = { BLACK: '#555', DARK_BLUE: '#5555FF', DARK_GREEN: '#55FF55', DARK_AQUA: '#55FFFF', DARK_RED: '#FF5555', DARK_PURPLE: '#FF55FF', GOLD: '#FFAA00', GRAY: '#AAAAAA', DARK_GRAY: '#888', BLUE: '#5555FF', GREEN: '#55FF55', AQUA: '#55FFFF', RED: '#FF5555', LIGHT_PURPLE: '#FF55FF', YELLOW: '#FFFF55', WHITE: '#FFFFFF' };
const CODE = { 0: '#555', 1: '#5555FF', 2: '#55FF55', 3: '#55FFFF', 4: '#FF5555', 5: '#FF55FF', 6: '#FFAA00', 7: '#AAAAAA', 8: '#888', 9: '#5555FF', a: '#55FF55', b: '#55FFFF', c: '#FF5555', d: '#FF55FF', e: '#FFFF55', f: '#FFFFFF' };
function rankInfo(pl) {
  if (pl.prefix) { const m = pl.prefix.match(/§([0-9a-f])/); return { name: pl.prefix.replace(/§./g, '').replace(/[\[\]]/g, ''), color: m ? CODE[m[1]] : '#FF5555' }; }
  const r = pl.rank && !['NORMAL', 'NONE'].includes(pl.rank) ? pl.rank : null;
  if (r) return { ADMIN: { name: 'ADMIN', color: '#FF5555' }, GAME_MASTER: { name: 'GM', color: '#55FF55' }, MODERATOR: { name: 'MOD', color: '#55FF55' }, YOUTUBER: { name: 'YOUTUBE', color: '#FF5555' } }[r] || { name: r, color: '#FF5555' };
  if (pl.monthlyPackageRank === 'SUPERSTAR') return { name: 'MVP', plus: '++', color: pl.monthlyRankColor === 'AQUA' ? '#55FFFF' : '#FFAA00', plusColor: MC[pl.rankPlusColor] || '#FF5555' };
  const pk = (pl.newPackageRank && pl.newPackageRank !== 'NONE') ? pl.newPackageRank : pl.packageRank;
  return { VIP: { name: 'VIP', color: '#55FF55' }, VIP_PLUS: { name: 'VIP', plus: '+', color: '#55FF55', plusColor: '#FFAA00' }, MVP: { name: 'MVP', color: '#55FFFF' }, MVP_PLUS: { name: 'MVP', plus: '+', color: '#55FFFF', plusColor: MC[pl.rankPlusColor] || '#FF5555' } }[pk] || null;
}
const starColor = s => s < 100 ? '#AAAAAA' : s < 200 ? '#FFFFFF' : s < 300 ? '#FFAA00' : s < 400 ? '#55FFFF' : s < 500 ? '#55FF55' : s < 600 ? '#55FFFF' : s < 700 ? '#FF5555' : s < 800 ? '#FF55FF' : s < 900 ? '#5555FF' : s < 1000 ? '#FF55FF' : '#FFFF55';
const day = ms => ms ? new Date(ms).toISOString().slice(0, 10) : null;

// The image reply: tools/bot-render/server.mjs (on the VPS) draws a PNG from the card data. Null when it isn't reachable — the text embed is sent instead.
async function renderCard(env, kind, data) {
  if (!env.RENDER_URL || !env.RENDER_KEY) return null;
  try {
    const c = new AbortController(); const tm = setTimeout(() => c.abort(), 9000);
    const r = await fetch(`${env.RENDER_URL}/render`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Render-Key': env.RENDER_KEY }, body: JSON.stringify({ kind, data }), signal: c.signal });
    clearTimeout(tm);
    if (!r.ok) return null;
    return await r.arrayBuffer();
  } catch (e) { return null; }
}

// ---------- static commands: answered instantly ----------
const STATIC = {
  help: () => ({ embeds: [{ color: COLOR.blue, title: 'waish bot', description: 'The same commands as the terminal on waish.ir.', fields: [
    { name: 'Minecraft', value: '`/user <player>` — full profile: skin, Hypixel, guild, blacklists\n`/check <player>` — is a player blacklisted? (Seraph + Urchin)\n`/stats <player>` — Hypixel level, rank, BedWars & SkyWars\n`/skin <player>` — current skin + 3D viewer\n`/guild <player or guild>` — Hypixel guild' },
    { name: 'Hypixel tools', value: '`/compare <a> <b>` — two players side by side\n`/prestige <player> [target]` — stars & XP to the next prestige, games and days at your pace\n`/ratio <player> [mode] [target]` — FKDR / WLR / BBLR / KDR: how many in a row to the next number\n`/leaderboard <guild>` — top members by weekly XP, today, quests or time in guild\n`/status <server>` — any Minecraft server: players, MOTD, version' },
    { name: 'Waish', value: '`/about` · `/projects` · `/lunamc` · `/socials` · `/site` · `/tools`' },
    { name: 'Use it anywhere', value: 'Add the app to your own account and these commands work in every server and in DMs — no need for the bot to be in the server.' },
  ], footer }], components: [row(btn('Open the terminal', `${SITE}/terminal.html`, '➜'), btn('Add to my apps', `https://discord.com/oauth2/authorize?client_id=${APP_ID}&integration_type=1&scope=applications.commands`, '👤'), btn('Add to a server', `https://discord.com/oauth2/authorize?client_id=${APP_ID}&integration_type=0&scope=applications.commands`, '🏠'))] }),
  about: () => ({ embeds: [{ color: COLOR.blue, title: 'Waish', description: 'Server admin, builder, content creator.\nRuns LunaMC, builds ClutchPing, streams on Aparat & YouTube, and the infra behind all of it.', thumbnail: { url: `${SITE}/assets/avatar.jpg` }, footer }], components: [row(btn('About me', `${SITE}/about-me.html`), btn('The full story', `${SITE}/terminal.html`, '📖'))] }),
  projects: () => ({ embeds: [{ color: COLOR.red, title: 'Projects', fields: [
    { name: '🟣 LunaMC', value: 'Persian-language Minecraft server — `Play.LunaMC.iR`' },
    { name: '⚡ ClutchPing', value: 'Lower ping for gamers — [clutchping.com](https://clutchping.com)' },
    { name: '🎬 Content', value: 'Streams & videos on [Aparat](https://aparat.com/waish) and [YouTube](https://www.youtube.com/@WaishChannel)' },
    { name: '💻 waish.ir', value: 'This site: a desktop simulator with apps, games, a music player and a terminal assistant.' },
  ], footer }], components: [row(btn('All projects', `${SITE}/projects.html`), btn('Open the computer', `${SITE}/computer.html`, '🖥️'))] }),
  lunamc: () => ({ embeds: [{ color: 0xa855f7, title: 'LunaMC', description: 'Persian-language Minecraft server.\nBedwars, custom plugins, active community.', fields: [{ name: 'IP', value: '`Play.LunaMC.iR`' }], thumbnail: { url: `${SITE}/assets/luna-logo.png` }, footer }], components: [row(btn('play.lunamc.ir', 'https://play.lunamc.ir'), btn('LunaMC on waish.ir', `${SITE}/projects/lunamc.html`))] }),
  socials: () => ({ embeds: [{ color: COLOR.red, title: 'Where to find Waish', description: [
    '▶️ [youtube.com/@WaishChannel](https://www.youtube.com/@WaishChannel)', '🎥 [aparat.com/waish](https://aparat.com/waish)', '📸 [instagram.com/asunawaish](https://instagram.com/asunawaish)',
    '✈️ [t.me/wishingcommunity](https://t.me/wishingcommunity)', `💬 [discord.gg/8HVsMqucZ2](${INVITE})`, '🟣 [play.lunamc.ir](https://play.lunamc.ir)', '⚡ [clutchping.com](https://clutchping.com)',
  ].join('\n'), footer }] }),
  tools: () => ({ embeds: [{ color: COLOR.yellow, title: 'Hypixel Tools on waish.ir', description: 'The apps behind the bot\'s commands — open them on the computer.', fields: [
    { name: '✫ Prestige Calculator', value: 'XP curve, games and days to any star, clickable prestige ladder', inline: true }, { name: '÷ Ratio Calculator', value: 'FKDR · WLR · BBLR · KDR targets, per BedWars mode', inline: true },
    { name: '⚔️ Compare Players', value: 'two players side by side, leader per row', inline: true }, { name: '🏆 Guild Leaderboard', value: 'weekly XP, today, quests, longest in guild', inline: true },
    { name: '📡 Server Status', value: 'any Java or Bedrock server', inline: true }, { name: '🖱️ CPS Test · 📝 Notepad', value: 'on the desktop', inline: true },
  ], footer }], components: [row(btn('Hypixel Tools', `${SITE}/computer.html#hyptools`, '🧰'), btn('User Lookup', `${SITE}/computer.html#userlookup`, '🔍'), btn('CPS Test', `${SITE}/computer.html#cpstest`, '🖱️'))] }),
  site: () => ({ embeds: [{ color: COLOR.blue, title: 'waish.ir', description: 'Home · Projects · About me · Contact · Donate — and the Computer: a desktop with apps, games, music and a terminal that answers questions in English or Persian.', footer }], components: [row(btn('waish.ir', SITE), btn('Computer', `${SITE}/computer.html`, '🖥️'), btn('Terminal', `${SITE}/terminal.html`, '➜'))] }),
};

// ---------- lookup commands: deferred (Discord gives 3 s; upstream APIs can take longer), then edited in ----------
async function resolve(api, who) {
  if (!/^([A-Za-z0-9_]{1,16}|[0-9a-fA-F]{32}|[0-9a-fA-F-]{36})$/.test(who)) return { err: 'Give a Minecraft username or UUID.' };
  const r = await api(`/convert?player=${encodeURIComponent(who)}`);
  if (r.status === 404) return { err: `Player not found: **${who}**` };
  if (!r.d || !r.d.success) return { err: `Could not resolve the player (${r.d && r.d.cause || r.status || 'network'}).` };
  return { ign: r.d.ign, uuid: r.d.uuid };
}
// Seraph + Urchin for one uuid → { bad, fields } (used by /check and /user)
async function blacklists(api, uuid) {
  const [se, ur] = await Promise.all([
    fetch(`https://api.seraph.si/${uuid}/blacklist`, { headers: { 'seraph-api-key': SERAPH_KEY, 'User-Agent': 'waish.ir bot' } }).then(async r => ({ status: r.status, d: await r.json().catch(() => null) })).catch(() => ({ status: 0 })),
    api(`/urchin?uuid=${uuid}`),
  ]);
  let bad = false; const fields = [];
  const fail = (r, host) => `${r.status === 429 ? 'rate limited' : (r.d && (r.d.cause || r.d.error)) || r.status || host + ' unreachable'}`;
  // detail = what the image card draws: one block per source, each report = { tag, message, meta }
  const detail = { seraph: { src: 'Seraph', state: 'fail', reports: [], note: null }, urchin: { src: 'Urchin', state: 'fail', reports: [], note: null } };
  if (se.status === 200 && se.d && se.d.success && se.d.data) {
    const bl = se.d.data.blacklist || {}, bot = se.d.data.bot || {};
    if (bl.tagged) { bad = true; fields.push({ name: 'Seraph', value: `⚠️ **BLACKLISTED** — ${bl.report_type || 'Blacklist'}${bl.verified ? ' (verified)' : ''}${clean(bl.reason || bl.tooltip) ? `\n${clean(bl.reason || bl.tooltip)}` : ''}` }); detail.seraph = { src: 'Seraph', state: 'bad', reports: [seraphReport(bl)] }; }
    else if (bot.tagged) { fields.push({ name: 'Seraph', value: `🤖 bot account${clean(bot.reason || bot.tooltip) ? `\n${clean(bot.reason || bot.tooltip)}` : ''}` }); detail.seraph = { src: 'Seraph', state: 'warn', reports: [{ ...seraphReport(bot), tag: 'Bot account' }] }; }
    else { fields.push({ name: 'Seraph', value: '✅ not blacklisted' }); detail.seraph = { src: 'Seraph', state: 'clean', reports: [], note: se.d.data.statistics && se.d.data.statistics.encounters ? `seen ${se.d.data.statistics.encounters}× by Seraph users` : null }; }
  } else { fields.push({ name: 'Seraph', value: `❔ check failed (${fail(se, 'api.seraph.si')})` }); detail.seraph.note = `check failed — ${fail(se, 'api.seraph.si')}`; }
  if (ur.d && ur.d.notConfigured) { fields.push({ name: 'Urchin', value: '❔ not configured' }); detail.urchin.note = 'not configured'; }
  else if (ur.status === 200 && ur.d && ur.d.success && Array.isArray(ur.d.tags)) {
    const tags = ur.d.tags;
    if (!tags.length) { fields.push({ name: 'Urchin', value: '✅ not blacklisted' }); detail.urchin = { src: 'Urchin', state: 'clean', reports: [] }; }
    else { bad = true; fields.push({ name: 'Urchin', value: `⚠️ **BLACKLISTED** — ${tags.map(x => title(x.tag_type)).join(' · ')}\n${tags.map(x => clean(x.reason) ? `${title(x.tag_type)}: ${clean(x.reason)}` : '').filter(Boolean).join('\n')}`.trim() });
      detail.urchin = { src: 'Urchin', state: 'bad', reports: tags.map(x => ({ tag: title(x.tag_type), message: clean(x.reason) || null, meta: [x.added_on ? day(x.added_on) : null, x.added_by_username ? `by ${x.added_by_username}` : null, x.expires_at ? `until ${day(x.expires_at)}` : null].filter(Boolean).join(' · ') || null })) }; }
  } else { fields.push({ name: 'Urchin', value: `❔ check failed (${fail(ur, 'api.urchin.gg')})` }); detail.urchin.note = `check failed — ${fail(ur, 'api.urchin.gg')}`; }
  return { bad, fields, detail };
}
// Seraph packs everything into one tooltip: "Blatant Cheating: hakar - funny tag ( Upgraded ) ( 1 week ago by waish ) " → tag / message / meta
function seraphReport(e) {
  let t = String(e.tooltip || e.reason || '').replace(/\(\s*upgraded\s*\)/gi, '').replace(/^\s*legacy\s*-\s*/i, '');
  let meta = null; const m = t.match(/\(\s*([^()]*?\bago\b[^()]*?)\)\s*$/i); if (m) { meta = m[1].trim(); t = t.slice(0, m.index); }
  const tag = e.report_type || 'Blacklist';
  if (t.toLowerCase().startsWith(tag.toLowerCase() + ':')) t = t.slice(tag.length + 1);
  const message = t.replace(/\s{2,}/g, ' ').trim() || null;
  return { tag, message, meta, verified: !!e.verified };
}
const LOOKUP = {
  async check(api, opts) {
    const p = await resolve(api, opts.player); if (p.err) return { content: p.err };
    const { bad, fields, detail } = await blacklists(api, p.uuid);
    return { card: ['check', { ign: p.ign, uuid: p.uuid, bad, seraph: detail.seraph, urchin: detail.urchin }],
      embeds: [{ color: bad ? COLOR.red : COLOR.green, title: p.ign, description: `\`${p.uuid}\``, thumbnail: { url: `https://crafatar.com/avatars/${p.uuid}?overlay&size=128` }, fields, footer }],
      components: [row(btn('Full profile on waish.ir', `${SITE}/computer.html#userlookup?u=${encodeURIComponent(p.ign)}`, '🔍'))] };
  },
  // /user — the whole User Lookup app in one card: who, skin, Hypixel, guild, both blacklists
  async user(api, opts) {
    const p = await resolve(api, opts.player); if (p.err) return { content: p.err };
    const [mj, hy, gu, bl] = await Promise.all([api(`/mojang?uuid=${p.uuid}`), api(`/player?uuid=${p.uuid}`), api(`/guild?uuid=${p.uuid}`), blacklists(api, p.uuid)]);
    const tex = mj.d && mj.d.textures && mj.d.textures.textures || {};
    const slim = tex.SKIN && tex.SKIN.metadata && tex.SKIN.metadata.model === 'slim', cape = tex.CAPE && tex.CAPE.url;
    const pl = hy.d && hy.d.success && hy.d.player, g = gu.d && gu.d.success && gu.d.guild;
    const fields = [
      { name: 'UUID', value: `\`${p.uuid}\``, inline: false },
      { name: 'Skin', value: `${slim ? 'slim (Alex)' : 'classic (Steve)'}${cape ? ' · cape' : ''}`, inline: true },
    ];
    if (pl) {
      const bw = (pl.stats || {}).Bedwars || {};
      const star = (pl.achievements && pl.achievements.bedwars_level) || (bw.Experience != null ? Math.floor(bwLevel(bw.Experience)) : null);
      const online = pl.lastLogin && pl.lastLogout && pl.lastLogin > pl.lastLogout;
      fields.push({ name: 'Hypixel', value: `level **${Math.floor(netLevel(pl.networkExp))}**${rankOf(pl) ? ` · ${rankOf(pl)}` : ''}${star != null ? ` · BedWars **${n(star)}✫**` : ''}${bw.final_kills_bedwars != null ? ` · FKDR ${ratio(bw.final_kills_bedwars, bw.final_deaths_bedwars)}` : ''}`, inline: false });
      const seen = [pl.firstLogin ? `first seen <t:${Math.floor(pl.firstLogin / 1000)}:D>` : '', pl.lastLogin ? (online ? '🟢 online' : `last seen <t:${Math.floor(pl.lastLogin / 1000)}:R>`) : '', pl.mostRecentGameType ? `last game ${title(pl.mostRecentGameType.toLowerCase())}` : ''].filter(Boolean).join(' · ');
      if (seen) fields.push({ name: 'Activity', value: seen, inline: false });
    } else fields.push({ name: 'Hypixel', value: hy.status === 404 ? 'no cached stats yet' : `unavailable (${hy.d && hy.d.cause || hy.status})`, inline: false });
    if (g) fields.push({ name: 'Guild', value: `**${g.name}**${g.tag ? ` [${g.tag}]` : ''} · level ${Math.floor(guildLevel(g.exp))} · ${(g.members || []).length} members`, inline: false });
    else if (pl) fields.push({ name: 'Guild', value: gu.d && gu.d.success ? 'none' : 'unavailable', inline: false });
    fields.push(...bl.fields.map(f => ({ ...f, inline: true })));
    const bw = pl ? ((pl.stats || {}).Bedwars || {}) : {};
    const star = pl ? ((pl.achievements && pl.achievements.bedwars_level) || (bw.Experience != null ? Math.floor(bwLevel(bw.Experience)) : null)) : null;
    const card = ['user', { ign: p.ign, uuid: p.uuid, bad: bl.bad, rank: pl ? rankInfo(pl) : null, star, starColor: star != null ? starColor(star) : null,
      level: pl ? Math.floor(netLevel(pl.networkExp)) : null, fkdr: bw.final_kills_bedwars != null ? ratio(bw.final_kills_bedwars, bw.final_deaths_bedwars) : null, bwWins: bw.wins_bedwars ?? null,
      finals: bw.final_kills_bedwars ?? null, wlr: bw.wins_bedwars != null ? ratio(bw.wins_bedwars, bw.losses_bedwars) : null, beds: bw.beds_broken_bedwars ?? null,
      karma: pl ? pl.karma ?? null : null, firstSeen: pl ? day(pl.firstLogin) : null, model: slim ? 'slim' : 'classic', cape: !!cape,
      guild: g ? { name: g.name, tag: g.tag || null, color: MC[g.tagColor] || '#AAAAAA', level: Math.floor(guildLevel(g.exp)), members: (g.members || []).length } : null,
      seraph: bl.detail.seraph, urchin: bl.detail.urchin, snapshot: hy.d && hy.d.lastUpdated ? day(hy.d.lastUpdated) : null,
      activity: pl && pl.lastLogin ? (pl.lastLogout && pl.lastLogin > pl.lastLogout ? 'online on Hypixel now' : `last on Hypixel ${day(pl.lastLogin)}`) : null }];
    return { card, embeds: [{ color: bl.bad ? COLOR.red : COLOR.blue, title: pl ? lobbyName(pl, p.ign) : p.ign, thumbnail: { url: `https://crafatar.com/renders/body/${p.uuid}?overlay&scale=4` }, fields, footer: hy.d && hy.d.lastUpdated ? { ...footer, text: `waish.ir · Hypixel snapshot ${new Date(hy.d.lastUpdated).toISOString().slice(0, 10)}` } : footer }],
      components: [row(btn('Open in User Lookup', `${SITE}/computer.html#userlookup?u=${encodeURIComponent(p.ign)}`, '🔍'), btn('3D skin', `${SITE}/computer.html#skineditor?u=${encodeURIComponent(p.ign)}`, '🎨'))] };
  },
  async stats(api, opts) {
    const p = await resolve(api, opts.player); if (p.err) return { content: p.err };
    const r = await api(`/player?uuid=${p.uuid}`);
    const pl = r.d && r.d.success && r.d.player;
    if (!pl) return { content: r.status === 404 ? `No Hypixel stats cached for **${p.ign}** yet — look them up on the site once: ${SITE}/computer.html#userlookup?u=${p.ign}` : `Stats lookup failed (${r.d && r.d.cause || r.status}).` };
    const st = pl.stats || {}, bw = st.Bedwars || {}, sw = st.SkyWars || {}, du = st.Duels || {};
    const star = (pl.achievements && pl.achievements.bedwars_level) || (bw.Experience != null ? Math.floor(bwLevel(bw.Experience)) : null);
    const fields = [{ name: 'Network', value: `level **${Math.floor(netLevel(pl.networkExp))}** · karma ${n(pl.karma)} · ${pl.achievementPoints != null ? n(pl.achievementPoints) + ' AP' : ''}`.replace(/ · $/, ''), inline: false }];
    if (bw.Experience != null || bw.wins_bedwars != null) fields.push({ name: 'BedWars', value: `${star != null ? `**${n(star)}✫** · ` : ''}wins ${n(bw.wins_bedwars)} · finals ${n(bw.final_kills_bedwars)} · FKDR **${ratio(bw.final_kills_bedwars, bw.final_deaths_bedwars)}** · WLR ${ratio(bw.wins_bedwars, bw.losses_bedwars)} · beds ${n(bw.beds_broken_bedwars)}`, inline: false });
    if (sw.wins != null) fields.push({ name: 'SkyWars', value: `wins ${n(sw.wins)} · kills ${n(sw.kills)} · KDR **${ratio(sw.kills, sw.deaths)}**`, inline: false });
    if (du.wins != null) fields.push({ name: 'Duels', value: `wins ${n(du.wins)} · WLR **${ratio(du.wins, du.losses)}** · best streak ${n(du.best_overall_winstreak)}`, inline: false });
    const when = r.d.lastUpdated ? `Bordic snapshot <t:${Math.floor(r.d.lastUpdated / 1000)}:R>` : undefined;
    const lvl = netLevel(pl.networkExp);
    const card = ['stats', { ign: p.ign, uuid: p.uuid, rank: rankInfo(pl), star, starColor: star != null ? starColor(star) : null, level: Math.floor(lvl), levelPct: (lvl % 1) * 100, karma: pl.karma ?? null,
      bw: { wins: bw.wins_bedwars ?? null, finals: bw.final_kills_bedwars ?? null, fkdr: bw.final_kills_bedwars != null ? ratio(bw.final_kills_bedwars, bw.final_deaths_bedwars) : '—', wlr: bw.wins_bedwars != null ? ratio(bw.wins_bedwars, bw.losses_bedwars) : '—' },
      sw: { wins: sw.wins ?? null, kdr: sw.kills != null ? ratio(sw.kills, sw.deaths) : '—' }, du: { wins: du.wins ?? null, wlr: du.wins != null ? ratio(du.wins, du.losses) : '—' }, snapshot: day(r.d.lastUpdated) }];
    return { card, embeds: [{ color: COLOR.yellow, title: lobbyName(pl, p.ign), description: when, thumbnail: { url: `https://crafatar.com/avatars/${p.uuid}?overlay&size=128` }, fields, footer }],
      components: [row(btn('Every game on waish.ir', `${SITE}/computer.html#userlookup?u=${encodeURIComponent(p.ign)}`, '📊'))] };
  },
  async skin(api, opts) {
    const p = await resolve(api, opts.player); if (p.err) return { content: p.err };
    const r = await api(`/mojang?uuid=${p.uuid}`);
    const tex = r.d && r.d.textures && r.d.textures.textures || {};
    const skin = tex.SKIN && tex.SKIN.url, slim = tex.SKIN && tex.SKIN.metadata && tex.SKIN.metadata.model === 'slim', cape = tex.CAPE && tex.CAPE.url;
    return { card: skin ? ['skin', { ign: p.ign, uuid: p.uuid, model: slim ? 'slim (Alex)' : 'classic (Steve)', cape: !!cape, skinUrl: skin }] : null,
      embeds: [{ color: COLOR.blue, title: p.ign, description: `${slim ? 'slim (Alex)' : 'classic (Steve)'} model${cape ? ' · has a cape' : ''}\n\`${p.uuid}\``, image: { url: `https://crafatar.com/renders/body/${p.uuid}?overlay&scale=8&t=${Math.floor(Date.now() / 60000)}` }, footer }],
      components: [row(btn('3D viewer & editor', `${SITE}/computer.html#skineditor?u=${encodeURIComponent(p.ign)}`, '🎨'), ...(skin ? [btn('Download skin', skin, '⬇️')] : []))] };
  },
  async guild(api, opts) {
    const q = (opts.name || '').trim();
    if (!q) return { content: 'Give a player name or a guild name.' };
    let r = null, byPlayer = null;
    if (/^([A-Za-z0-9_]{1,16}|[0-9a-fA-F-]{32,36})$/.test(q)) { byPlayer = await resolve(api, q); if (!byPlayer.err) r = await api(`/guild?uuid=${byPlayer.uuid}`); }
    if (!r || !(r.d && r.d.success && r.d.guild)) r = await api(`/guild?name=${encodeURIComponent(q.slice(0, 32))}`);
    const g = r.d && r.d.success && r.d.guild;
    if (!g) return { content: r.d && r.d.success === true ? `No guild found for **${q}**.` : `Guild lookup failed (${r.d && r.d.cause || r.status}).` };
    const lvl = guildLevel(g.exp), members = g.members || [];
    const gm = members.find(m => /^guild ?master$/i.test(m.rank || ''));
    const fields = [
      { name: 'Level', value: `**${Math.floor(lvl)}** (${Math.round((lvl % 1) * 100)}%)`, inline: true },
      { name: 'Members', value: `${members.length}`, inline: true },
      { name: 'Created', value: g.created ? `<t:${Math.floor(g.created / 1000)}:D>` : '—', inline: true },
    ];
    if (g.description) fields.push({ name: 'Description', value: g.description.slice(0, 500) });
    let gmName = null;
    if (gm) { const nm = await api(`/names?uuids=${gm.uuid}`); gmName = (nm.d && nm.d.names && nm.d.names[gm.uuid]) || null; fields.push({ name: 'Guild master', value: gmName || `\`${gm.uuid}\`` }); }
    const card = ['guild', { query: q, name: g.name, tag: g.tag || null, color: MC[g.tagColor] || '#FFAA00', of: byPlayer && !byPlayer.err ? byPlayer.ign : null, gm: gmName, gmUuid: gm ? gm.uuid : (byPlayer && !byPlayer.err ? byPlayer.uuid : null),
      level: Math.floor(lvl), levelPct: Math.round((lvl % 1) * 100), members: members.length, created: day(g.created), description: g.description || null }];
    return { card, embeds: [{ color: COLOR.yellow, title: `${g.name}${g.tag ? ` [${g.tag}]` : ''}`, description: byPlayer && !byPlayer.err ? `guild of **${byPlayer.ign}**` : undefined, fields, footer }],
      components: [row(btn('Open on waish.ir', `${SITE}/computer.html#userlookup?u=${encodeURIComponent(byPlayer && !byPlayer.err ? byPlayer.ign : q)}`, '🔍'))] };
  },
};

// ---------- BedWars maths shared with the site's Hypixel Tools (apps/tools.js) ----------
const xpForStar = s => { s = Math.max(0, Math.floor(s)); const p = Math.floor(s / 100), l = s % 100; const first = [0, 500, 1500, 3500, 7000]; return p * 487000 + (l < 5 ? first[l] : 7000 + (l - 4) * 5000); };
const PRESTIGES = ['Stone', 'Iron', 'Gold', 'Diamond', 'Emerald', 'Sapphire', 'Ruby', 'Crystal', 'Opal', 'Amethyst', 'Rainbow', 'Iron Prime', 'Gold Prime', 'Diamond Prime', 'Emerald Prime', 'Sapphire Prime', 'Ruby Prime', 'Crystal Prime', 'Opal Prime', 'Amethyst Prime', 'Mirror', 'Light', 'Dawn', 'Dusk', 'Air', 'Wind', 'Nebula', 'Thunder', 'Earth', 'Water', 'Fire'];
const prestigeName = s => PRESTIGES[Math.floor(s / 100)] || `Prestige ${Math.floor(s / 100)}`;
// FKDR tiers, same thresholds as User Lookup ('rainbow' past 100 — the card draws a gradient)
const fkdrColor = f => f >= 100 ? 'rainbow' : f >= 60 ? '#55FFFF' : f >= 30 ? '#FF55FF' : f >= 10 ? '#FF5555' : f >= 7 ? '#FFFF55' : f >= 3 ? '#55FF55' : f >= 1 ? '#FFFFFF' : '#AAAAAA';
const bwOf = pl => (pl.stats || {}).Bedwars || {}, swOf = pl => (pl.stats || {}).SkyWars || {}, duOf = pl => (pl.stats || {}).Duels || {};
const starOf = pl => (pl.achievements && pl.achievements.bedwars_level) || (bwOf(pl).Experience != null ? Math.floor(bwLevel(bwOf(pl).Experience)) : 0);
const swLevel = xp => { const T = [0, 20, 70, 150, 250, 500, 1000, 2000, 3500, 6000, 10000, 15000]; xp = xp || 0; if (xp >= 15000) return 12 + (xp - 15000) / 10000; let i = 0; while (i < T.length - 1 && xp >= T[i + 1]) i++; return i + (xp - T[i]) / (T[i + 1] - T[i]); };
// resolve + Hypixel player in one go → { ign, uuid, pl, snapshot } or { err }
async function loadPlayer(api, who) {
  const p = await resolve(api, String(who || '').trim()); if (p.err) return p;
  const r = await api(`/player?uuid=${p.uuid}`); const pl = r.d && r.d.success && r.d.player;
  if (!pl) return { err: r.status === 404 ? `No Hypixel stats cached for **${p.ign}** yet — look them up on the site once: ${SITE}/computer.html#userlookup?u=${p.ign}` : `Stats lookup failed for **${p.ign}** (${r.d && r.d.cause || r.status}).` };
  return { ...p, ign: pl.displayname || p.ign, pl, snapshot: day(r.d.lastUpdated) };
}
const headerOf = x => ({ ign: x.ign, uuid: x.uuid, rank: rankInfo(x.pl), star: starOf(x.pl), starColor: starColor(starOf(x.pl)), level: Math.floor(netLevel(x.pl.networkExp)) });
// rows for /compare: [label, value(pl), format]
const CMP = [
  ['Stars', pl => starOf(pl), v => `${n(v)}✫`], ['FKDR', pl => +ratio(bwOf(pl).final_kills_bedwars, bwOf(pl).final_deaths_bedwars), v => v.toFixed(2)],
  ['WLR', pl => +ratio(bwOf(pl).wins_bedwars, bwOf(pl).losses_bedwars), v => v.toFixed(2)], ['BBLR', pl => +ratio(bwOf(pl).beds_broken_bedwars, bwOf(pl).beds_lost_bedwars), v => v.toFixed(2)],
  ['KDR', pl => +ratio(bwOf(pl).kills_bedwars, bwOf(pl).deaths_bedwars), v => v.toFixed(2)], ['Final kills', pl => bwOf(pl).final_kills_bedwars || 0], ['Wins', pl => bwOf(pl).wins_bedwars || 0],
  ['Beds broken', pl => bwOf(pl).beds_broken_bedwars || 0], ['Win rate', pl => { const b = bwOf(pl), g = b.games_played_bedwars || ((b.wins_bedwars || 0) + (b.losses_bedwars || 0)); return g ? 100 * (b.wins_bedwars || 0) / g : 0; }, v => `${Math.round(v)}%`],
  ['Network level', pl => Math.floor(netLevel(pl.networkExp))], ['SkyWars level', pl => swOf(pl).skywars_experience != null ? Math.floor(swLevel(swOf(pl).skywars_experience)) : 0, v => `${n(v)}⋆`], ['Duels wins', pl => duOf(pl).wins || 0],
];
const RATIOS = [['FKDR', 'final kills', 'final deaths', 'final_kills_bedwars', 'final_deaths_bedwars', 'final death'], ['WLR', 'wins', 'losses', 'wins_bedwars', 'losses_bedwars', 'loss'], ['BBLR', 'beds broken', 'beds lost', 'beds_broken_bedwars', 'beds_lost_bedwars', 'lost bed'], ['KDR', 'kills', 'deaths', 'kills_bedwars', 'deaths_bedwars', 'death']];
const MODES = { '': 'Overall', eight_one_: 'Solo', eight_two_: 'Doubles', four_three_: '3v3v3v3', four_four_: '4v4v4v4', two_four_: '4v4' };
// mcsrvstat.us v3 → the mcstatus.io shape
const fromMcsrvstat = d => ({ online: !!d.online, host: d.hostname || d.ip, port: d.port, ip_address: d.ip, eula_blocked: !!d.eula_blocked, version: d.version ? { name_clean: d.version, protocol: d.protocol && d.protocol.version } : null,
  players: d.players ? { online: d.players.online, max: d.players.max, list: (d.players.list || []).map(p => ({ uuid: p.uuid, name_clean: p.name })) } : null, motd: d.motd ? { raw: (d.motd.raw || []).join('\n'), clean: (d.motd.clean || []).join('\n') } : null, icon: d.icon || null, software: d.software || null, plugins: d.plugins || [], mods: d.mods || [], gamemode: d.gamemode, srv_record: null });

const TOOLS = {
  // /compare — two players side by side, the leader of each row highlighted
  async compare(api, opts) {
    const [A, B] = await Promise.all([loadPlayer(api, opts.player1), loadPlayer(api, opts.player2)]);
    if (A.err) return { content: A.err }; if (B.err) return { content: B.err };
    let wa = 0, wb = 0;
    const rows = CMP.map(([label, get, fmt]) => { const a = get(A.pl), b = get(B.pl); const win = a === b ? 0 : a > b ? 1 : 2; if (win === 1) wa++; else if (win === 2) wb++; const f = fmt || n; return { label, a: f(a), b: f(b), pa: Math.round(100 * a / Math.max(a, b, 1e-9)), pb: Math.round(100 * b / Math.max(a, b, 1e-9)), win }; });
    const lead = wa === wb ? 'dead even' : `${wa > wb ? A.ign : B.ign} leads ${Math.max(wa, wb)}–${Math.min(wa, wb)}`;
    const pad = (s, w) => String(s).padStart(w);
    const table = '```\n' + `${'stat'.padEnd(14)}${pad(A.ign.slice(0, 12), 13)}${pad(B.ign.slice(0, 12), 13)}\n` + rows.map(r => `${r.label.padEnd(14)}${pad(r.a, 12)}${r.win === 1 ? '◀' : ' '}${pad(r.b, 12)}${r.win === 2 ? '◀' : ' '}`).join('\n') + '\n```';
    return { card: ['compare', { a: headerOf(A), b: headerOf(B), rows, score: [wa, wb], lead, snapshot: A.snapshot || B.snapshot }],
      embeds: [{ color: COLOR.blue, title: `${A.ign} vs ${B.ign}`, description: `**${lead}**\n${table}`, footer }],
      components: [row(btn('Open in Compare Players', `${SITE}/computer.html#compare?a=${encodeURIComponent(A.ign)}&b=${encodeURIComponent(B.ign)}`, '⚔️'))] };
  },
  // /prestige — how far to the next prestige (or any target star), at the player's real XP-per-game pace
  async prestige(api, opts) {
    const x = await loadPlayer(api, opts.player); if (x.err) return { content: x.err };
    // XP is the truth (the achievement star can lag behind it)
    const bw = bwOf(x.pl), xp = bw.Experience != null ? bw.Experience : xpForStar(starOf(x.pl)), star = bw.Experience != null ? Math.floor(bwLevel(xp)) : starOf(x.pl);
    const games = bw.games_played_bedwars || ((bw.wins_bedwars || 0) + (bw.losses_bedwars || 0)) || 0, xpg = games ? Math.max(1, Math.round(xp / games)) : 120;
    const days = x.pl.firstLogin ? Math.max(1, (Date.now() - x.pl.firstLogin) / 86400000) : null, gpd = days && games ? games / days : 0;
    let target = Number(opts.target); if (!Number.isFinite(target) || target <= star) target = (Math.floor(star / 100) + 1) * 100; target = Math.min(10000, Math.floor(target));
    const toGo = Math.max(0, xpForStar(target) - xp), from = xpForStar(star), pct = Math.min(100, Math.max(0, Math.round(100 * (xp - from) / Math.max(1, xpForStar(target) - from))));
    const need = Math.ceil(toGo / xpg), dNeed = gpd > 0 ? need / gpd : null, eta = dNeed != null ? day(Date.now() + dNeed * 86400000) : null;
    const d = { ...headerOf(x), star, starColor: starColor(star), prestige: prestigeName(star), next: { name: prestigeName(target), star: target, color: starColor(target) }, toGoStars: target - star, toGoXP: toGo, pct, games: need, days: dNeed != null ? Math.ceil(dNeed) : null, eta, xpg, gpd: +gpd.toFixed(1), xpNext: xpForStar(star + 1) - xp, xpNextFull: xpForStar(star + 1) - from, totalXP: xp, played: games, snapshot: x.snapshot };
    return { card: ['prestige', d],
      embeds: [{ color: COLOR.yellow, title: `${lobbyName(x.pl, x.ign)} — ${n(star)}✫ → ${n(target)}✫`, description: `${prestigeName(star)} now · **${n(target - star)} stars** and **${n(toGo)} XP** to ${prestigeName(target)}\n${pct}% of the way`, fields: [
        { name: 'Games needed', value: `**${n(need)}** at ${n(xpg)} XP/game`, inline: true }, { name: 'At your pace', value: dNeed != null ? `**${n(Math.ceil(dNeed))} days** (${gpd.toFixed(1)} games/day) · ETA ${eta}` : '—', inline: true }, { name: 'Next star', value: `${n(d.xpNext)} XP`, inline: true }], thumbnail: { url: `https://crafatar.com/avatars/${x.uuid}?overlay&size=128` }, footer }],
      components: [row(btn('Open in Prestige Calculator', `${SITE}/computer.html#prestige?u=${encodeURIComponent(x.ign)}`, '✫'))] };
  },
  // /ratio — FKDR / WLR / BBLR / KDR with "how many in a row" to the next whole number (or a target)
  async ratio(api, opts) {
    const x = await loadPlayer(api, opts.player); if (x.err) return { content: x.err };
    const P = MODES[opts.mode] ? opts.mode : '', bw = bwOf(x.pl), tgt = Number(opts.target);
    const items = RATIOS.map(([title, la, lb, ka, kb, lb1]) => { const a = bw[P + ka] || 0, b = bw[P + kb] || 0, cur = a / Math.max(1, b); const target = Number.isFinite(tgt) && tgt > 0 ? tgt : Math.floor(cur) + 1; const need = Math.max(0, Math.ceil(target * Math.max(1, b) - a)), afford = cur >= target ? Math.floor(a / target - b) : 0; return { title, la, lb, lb1, a, b, cur: cur.toFixed(2), target: target.toFixed(2), need, afford, above: cur >= target, pct: Math.min(100, Math.round(100 * cur / target)), color: title === 'FKDR' ? fkdrColor(cur) : null }; });
    return { card: ['ratio', { ...headerOf(x), mode: MODES[P], items, snapshot: x.snapshot }],
      embeds: [{ color: COLOR.yellow, title: `${lobbyName(x.pl, x.ign)} · ${MODES[P]}`, fields: items.map(i => ({ name: `${i.title} ${i.cur} → ${i.target}`, value: i.above ? `✅ above target · can take **${n(i.afford)}** more ${i.lb}` : `**${n(i.need)}** ${i.la} in a row`, inline: false })), thumbnail: { url: `https://crafatar.com/avatars/${x.uuid}?overlay&size=128` }, footer }],
      components: [row(btn('Open in Ratio Calculator', `${SITE}/computer.html#ratio?u=${encodeURIComponent(x.ign)}`, '÷'))] };
  },
  // /status — any Minecraft server (mcstatus.io, mcsrvstat.us as the second opinion)
  async status(api, opts) {
    const host = String(opts.server || '').trim().toLowerCase(), edition = opts.edition === 'bedrock' ? 'bedrock' : 'java';
    if (!/^[a-z0-9.\-_:]{1,120}$/.test(host)) return { content: 'Give a server address like `play.lunamc.ir` or `ip:port`.' };
    const t0 = Date.now(); let d = null;
    try { const r = await fetch(`https://api.mcstatus.io/v2/status/${edition}/${encodeURIComponent(host)}`, { headers: { 'User-Agent': 'waish.ir bot' } }); d = await r.json().catch(() => null); } catch (e) {}
    if (!d) return { content: 'The status API did not answer — try again in a moment.' };
    if (!d.online) { try { const r = await fetch(`https://api.mcsrvstat.us/${edition === 'bedrock' ? 'bedrock/' : ''}3/${encodeURIComponent(host)}`, { headers: { 'User-Agent': 'waish.ir bot' } }); const d2 = await r.json().catch(() => null); if (d2 && d2.online) d = fromMcsrvstat(d2); } catch (e) {} }
    const ms = Date.now() - t0, ver = d.version ? (d.version.name_clean || d.version.name || '') : '', on = d.players ? d.players.online || 0 : 0, max = d.players ? d.players.max || 0 : 0;
    const list = ((d.players && d.players.list) || []).map(p => p.name_clean || p.name).filter(Boolean);
    const data = { host, edition, online: !!d.online, icon: d.icon && d.icon.startsWith('data:') ? d.icon : null, version: ver, protocol: d.version && d.version.protocol, on, max, list: list.slice(0, 24), more: Math.max(0, list.length - 24), motd: d.motd ? d.motd.raw || d.motd.clean || '' : '', ip: d.ip_address || null, port: d.port || null, software: d.software || null, plugins: (d.plugins || []).length, mods: (d.mods || []).length, srv: d.srv_record ? `${d.srv_record.host}:${d.srv_record.port}` : null, eula: !!d.eula_blocked, gamemode: d.gamemode || null, ms, checked: new Date().toISOString().slice(11, 16) + ' UTC' };
    const fields = [{ name: 'Players', value: `**${n(on)}** / ${n(max)}${list.length ? `\n${list.slice(0, 15).join(', ')}${list.length > 15 ? ` +${list.length - 15}` : ''}` : ''}`, inline: false }];
    if (ver) fields.push({ name: 'Version', value: ver, inline: true }); if (d.ip_address) fields.push({ name: 'IP', value: `${d.ip_address}:${d.port}`, inline: true }); if (d.software) fields.push({ name: 'Software', value: d.software, inline: true });
    if (d.motd && (d.motd.clean || d.motd.raw)) fields.push({ name: 'MOTD', value: '```\n' + String(d.motd.clean || d.motd.raw).replace(/§./g, '').slice(0, 300) + '\n```', inline: false });
    return { card: ['status', data],
      embeds: [{ color: d.online ? COLOR.green : COLOR.red, title: `${host} — ${d.online ? '🟢 online' : '🔴 offline'}`, description: d.online ? undefined : 'Offline or unreachable. Big networks sometimes block status pings — it may still be up in-game.', fields, footer: { ...footer, text: `waish.ir · mcstatus.io · ${ms} ms` } }],
      components: [row(btn('Open in Server Status', `${SITE}/computer.html#serverstatus?s=${encodeURIComponent(host)}${edition === 'bedrock' ? '&e=bedrock' : ''}`, '📡'))] };
  },
  // /leaderboard — a guild's top members by weekly XP (or today / quests / longest in guild)
  async leaderboard(api, opts) {
    const q = String(opts.guild || '').trim(); if (!q) return { content: 'Give a guild name, or a player who is in it.' };
    let r = null, byPlayer = null;
    if (/^([A-Za-z0-9_]{1,16}|[0-9a-fA-F-]{32,36})$/.test(q)) { byPlayer = await resolve(api, q); if (!byPlayer.err) r = await api(`/guild?uuid=${byPlayer.uuid}`); }
    if (!r || !(r.d && r.d.success && r.d.guild)) r = await api(`/guild?name=${encodeURIComponent(q.slice(0, 32))}`);
    const g = r.d && r.d.success && r.d.guild;
    if (!g) return { content: r.d && r.d.success === true ? `No guild found for **${q}**.` : `Guild lookup failed (${r.d && r.d.cause || r.status}).` };
    const today = new Date().toISOString().slice(0, 10), weekly = m => m.expHistory ? Object.values(m.expHistory).reduce((a, b) => a + (b || 0), 0) : 0;
    const BY = { weekly: ['weekly XP', weekly, v => `${n(v)} XP`], today: ["today's XP", m => (m.expHistory && m.expHistory[today]) || 0, v => `${n(v)} XP`], quests: ['quest participation', m => m.questParticipation || 0, v => n(v)], longest: ['longest in guild', m => m.joined ? Math.floor((Date.now() - m.joined) / 86400000) : 0, v => `${n(v)} days`] };
    const by = BY[opts.by] ? opts.by : 'weekly', [label, get, fmt] = BY[by];
    const members = (g.members || []).slice().sort((a, b) => get(b) - get(a)), top = members.slice(0, 10), best = get(top[0] || {}) || 1;
    const nm = top.length ? await api(`/names?uuids=${top.map(m => m.uuid).join(',')}`) : { d: null }; const names = (nm.d && nm.d.names) || {};
    const total = members.reduce((a, m) => a + weekly(m), 0), active = members.filter(m => weekly(m) > 0).length;
    const rows = top.map((m, i) => ({ i: i + 1, uuid: m.uuid, name: names[m.uuid] || m.uuid.slice(0, 8) + '…', rank: m.rank || '', value: fmt(get(m)), pct: Math.round(100 * get(m) / best), share: total && by === 'weekly' ? Math.round(100 * get(m) / total) : null }));
    const card = ['leaderboard', { query: q, name: g.name, tag: g.tag || null, color: MC[g.tagColor] || '#FFAA00', level: Math.floor(guildLevel(g.exp)), members: members.length, active, total, by: label, rows }];
    const medal = i => ['🥇', '🥈', '🥉'][i - 1] || `**${i}.**`;
    return { card, embeds: [{ color: COLOR.yellow, title: `${g.name}${g.tag ? ` [${g.tag}]` : ''} — top ${label}`, description: rows.map(x => `${medal(x.i)} ${x.name} — **${x.value}**${x.share != null ? ` (${x.share}%)` : ''}`).join('\n') || 'no members', fields: [{ name: 'This week', value: `${n(total)} XP · ${active}/${members.length} members active`, inline: false }], footer }],
      components: [row(btn('Open in Guild Leaderboard', `${SITE}/computer.html#guildboard?g=${encodeURIComponent(g.name)}`, '🏆'))] };
  },
};
Object.assign(LOOKUP, TOOLS);

// Discord edits the deferred message through the interaction token — no bot token needed for that.
async function followUp(env, token, data) {
  const url = `https://discord.com/api/v10/webhooks/${env.DISCORD_APP_ID}/${token}/messages/@original`;
  const { card, ...rest } = data;
  const png = card ? await renderCard(env, card[0], card[1]) : null;
  if (png) {   // the card as a full-width image + the same buttons; the embed is only for the text fallback
    const fd = new FormData();
    fd.append('payload_json', JSON.stringify({ components: rest.components || [], attachments: [{ id: 0, filename: 'card.png' }] }));
    fd.append('files[0]', new Blob([png], { type: 'image/png' }), 'card.png');
    const r = await fetch(url, { method: 'PATCH', body: fd });
    if (r.ok) return;
  }
  await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rest) });
}

export const _test = { LOOKUP, STATIC };   // for local test scripts only

/** POST /discord — `api(path)` calls the worker's own routes in-process and returns {status, d}. */
export async function handleInteraction(request, env, ctx, api) {
  const body = await request.text();
  if (!(await verify(request, body, env))) return new Response('bad signature', { status: 401 });
  let it; try { it = JSON.parse(body); } catch (e) { return new Response('bad json', { status: 400 }); }
  if (it.type === 1) return new Response(JSON.stringify({ type: 1 }), { headers: { 'Content-Type': 'application/json' } });   // Discord's endpoint check
  if (it.type !== 2) return reply({ content: 'Unsupported interaction.' }, true);
  const name = (it.data && it.data.name || '').toLowerCase();
  const opts = Object.fromEntries(((it.data && it.data.options) || []).map(o => [o.name, o.value]));
  if (STATIC[name]) return reply(STATIC[name]());
  if (LOOKUP[name]) {
    ctx.waitUntil((async () => {
      let data;
      try { data = await LOOKUP[name](api, opts); }
      catch (e) { data = { content: `Something broke: ${e.message || e}` }; }
      await followUp(env, it.token, data);
    })());
    return new Response(JSON.stringify({ type: 5 }), { headers: { 'Content-Type': 'application/json' } });   // "thinking…" — edited in when the lookup is done
  }
  return reply({ content: `Unknown command \`/${name}\` — try \`/help\`.` }, true);
}
