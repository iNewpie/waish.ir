/* ============================================================
   WAISH DISCORD BOT — slash commands answered by the proxy worker (tools/proxy.worker.js).
   No always-on process: Discord POSTs every command to <worker-url>/discord, the worker answers and goes back to sleep.
   Free on the Workers free plan (100,000 requests/day).

   The lookup commands reuse the worker's own routes (/convert, /urchin, /player, /guild, /mojang), so the bot and the
   site terminal (/check on waish.ir) give the same answer from the same code.

   SETUP
     1. discord.com/developers/applications → your app → General Information: copy Application ID + Public Key
        into tools/proxy.env as DISCORD_APP_ID / DISCORD_PUBLIC_KEY (the Bot token goes in as DISCORD_BOT_TOKEN, only
        the register script needs it). `bash tools/deploy-worker.sh` puts them on the worker as secrets.
     2. `bash tools/discord-register.sh` — registers the slash commands in tools/discord-commands.json (global, instant).
     3. App → General Information → Interactions Endpoint URL = <worker-url>/discord → Save (Discord sends a PING to verify).
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

// ---------- static commands: answered instantly ----------
const STATIC = {
  help: () => ({ embeds: [{ color: COLOR.blue, title: 'waish bot', description: 'The same commands as the terminal on waish.ir.', fields: [
    { name: 'Minecraft', value: '`/user <player>` — full profile: skin, Hypixel, guild, blacklists\n`/check <player>` — is a player blacklisted? (Seraph + Urchin)\n`/stats <player>` — Hypixel level, rank, BedWars & SkyWars\n`/skin <player>` — current skin + 3D viewer\n`/guild <player or guild>` — Hypixel guild' },
    { name: 'Waish', value: '`/about` · `/projects` · `/lunamc` · `/socials` · `/site`' },
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
  const fail = (r, host) => `❔ check failed (${r.status === 429 ? 'rate limited' : (r.d && (r.d.cause || r.d.error)) || r.status || host + ' unreachable'})`;
  if (se.status === 200 && se.d && se.d.success && se.d.data) {
    const bl = se.d.data.blacklist || {}, bot = se.d.data.bot || {};
    if (bl.tagged) { bad = true; fields.push({ name: 'Seraph', value: `⚠️ **BLACKLISTED** — ${bl.report_type || 'Blacklist'}${bl.verified ? ' (verified)' : ''}${clean(bl.reason || bl.tooltip) ? `\n${clean(bl.reason || bl.tooltip)}` : ''}` }); }
    else if (bot.tagged) fields.push({ name: 'Seraph', value: `🤖 bot account${clean(bot.reason || bot.tooltip) ? `\n${clean(bot.reason || bot.tooltip)}` : ''}` });
    else fields.push({ name: 'Seraph', value: '✅ not blacklisted' });
  } else fields.push({ name: 'Seraph', value: fail(se, 'api.seraph.si') });
  if (ur.d && ur.d.notConfigured) fields.push({ name: 'Urchin', value: '❔ not configured' });
  else if (ur.status === 200 && ur.d && ur.d.success && Array.isArray(ur.d.tags)) {
    const tags = ur.d.tags;
    if (!tags.length) fields.push({ name: 'Urchin', value: '✅ not blacklisted' });
    else { bad = true; fields.push({ name: 'Urchin', value: `⚠️ **BLACKLISTED** — ${tags.map(x => title(x.tag_type)).join(' · ')}\n${tags.map(x => clean(x.reason) ? `${title(x.tag_type)}: ${clean(x.reason)}` : '').filter(Boolean).join('\n')}`.trim() }); }
  } else fields.push({ name: 'Urchin', value: fail(ur, 'api.urchin.gg') });
  return { bad, fields };
}
const LOOKUP = {
  async check(api, opts) {
    const p = await resolve(api, opts.player); if (p.err) return { content: p.err };
    const { bad, fields } = await blacklists(api, p.uuid);
    return { embeds: [{ color: bad ? COLOR.red : COLOR.green, title: p.ign, description: `\`${p.uuid}\``, thumbnail: { url: `https://crafatar.com/avatars/${p.uuid}?overlay&size=128` }, fields, footer }],
      components: [row(btn('Full profile on waish.ir', `${SITE}/apps/lookup.html?u=${encodeURIComponent(p.ign)}`, '🔍'))] };
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
    return { embeds: [{ color: bl.bad ? COLOR.red : COLOR.blue, title: pl ? lobbyName(pl, p.ign) : p.ign, thumbnail: { url: `https://crafatar.com/renders/body/${p.uuid}?overlay&scale=4` }, fields, footer: hy.d && hy.d.lastUpdated ? { ...footer, text: `waish.ir · Hypixel snapshot ${new Date(hy.d.lastUpdated).toISOString().slice(0, 10)}` } : footer }],
      components: [row(btn('Open in User Lookup', `${SITE}/apps/lookup.html?u=${encodeURIComponent(p.ign)}`, '🔍'), btn('3D skin', `${SITE}/apps/skin-editor.html?u=${encodeURIComponent(p.ign)}`, '🎨'))] };
  },
  async stats(api, opts) {
    const p = await resolve(api, opts.player); if (p.err) return { content: p.err };
    const r = await api(`/player?uuid=${p.uuid}`);
    const pl = r.d && r.d.success && r.d.player;
    if (!pl) return { content: r.status === 404 ? `No Hypixel stats cached for **${p.ign}** yet — look them up on the site once: ${SITE}/apps/lookup.html?u=${p.ign}` : `Stats lookup failed (${r.d && r.d.cause || r.status}).` };
    const st = pl.stats || {}, bw = st.Bedwars || {}, sw = st.SkyWars || {}, du = st.Duels || {};
    const star = (pl.achievements && pl.achievements.bedwars_level) || (bw.Experience != null ? Math.floor(bwLevel(bw.Experience)) : null);
    const fields = [{ name: 'Network', value: `level **${Math.floor(netLevel(pl.networkExp))}** · karma ${n(pl.karma)} · ${pl.achievementPoints != null ? n(pl.achievementPoints) + ' AP' : ''}`.replace(/ · $/, ''), inline: false }];
    if (bw.Experience != null || bw.wins_bedwars != null) fields.push({ name: 'BedWars', value: `${star != null ? `**${n(star)}✫** · ` : ''}wins ${n(bw.wins_bedwars)} · finals ${n(bw.final_kills_bedwars)} · FKDR **${ratio(bw.final_kills_bedwars, bw.final_deaths_bedwars)}** · WLR ${ratio(bw.wins_bedwars, bw.losses_bedwars)} · beds ${n(bw.beds_broken_bedwars)}`, inline: false });
    if (sw.wins != null) fields.push({ name: 'SkyWars', value: `wins ${n(sw.wins)} · kills ${n(sw.kills)} · KDR **${ratio(sw.kills, sw.deaths)}**`, inline: false });
    if (du.wins != null) fields.push({ name: 'Duels', value: `wins ${n(du.wins)} · WLR **${ratio(du.wins, du.losses)}** · best streak ${n(du.best_overall_winstreak)}`, inline: false });
    const when = r.d.lastUpdated ? `Bordic snapshot <t:${Math.floor(r.d.lastUpdated / 1000)}:R>` : undefined;
    return { embeds: [{ color: COLOR.yellow, title: lobbyName(pl, p.ign), description: when, thumbnail: { url: `https://crafatar.com/avatars/${p.uuid}?overlay&size=128` }, fields, footer }],
      components: [row(btn('Every game on waish.ir', `${SITE}/apps/lookup.html?u=${encodeURIComponent(p.ign)}`, '📊'))] };
  },
  async skin(api, opts) {
    const p = await resolve(api, opts.player); if (p.err) return { content: p.err };
    const r = await api(`/mojang?uuid=${p.uuid}`);
    const tex = r.d && r.d.textures && r.d.textures.textures || {};
    const skin = tex.SKIN && tex.SKIN.url, slim = tex.SKIN && tex.SKIN.metadata && tex.SKIN.metadata.model === 'slim', cape = tex.CAPE && tex.CAPE.url;
    return { embeds: [{ color: COLOR.blue, title: p.ign, description: `${slim ? 'slim (Alex)' : 'classic (Steve)'} model${cape ? ' · has a cape' : ''}\n\`${p.uuid}\``, image: { url: `https://crafatar.com/renders/body/${p.uuid}?overlay&scale=8&t=${Math.floor(Date.now() / 60000)}` }, footer }],
      components: [row(btn('3D viewer & editor', `${SITE}/apps/skin-editor.html?u=${encodeURIComponent(p.ign)}`, '🎨'), ...(skin ? [btn('Download skin', skin, '⬇️')] : []))] };
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
    if (gm) { const nm = await api(`/names?uuids=${gm.uuid}`); fields.push({ name: 'Guild master', value: (nm.d && nm.d.names && nm.d.names[gm.uuid]) || `\`${gm.uuid}\`` }); }
    return { embeds: [{ color: COLOR.yellow, title: `${g.name}${g.tag ? ` [${g.tag}]` : ''}`, description: byPlayer && !byPlayer.err ? `guild of **${byPlayer.ign}**` : undefined, fields, footer }],
      components: [row(btn('Open on waish.ir', `${SITE}/apps/lookup.html?u=${encodeURIComponent(byPlayer && !byPlayer.err ? byPlayer.ign : q)}`, '🔍'))] };
  },
};

// Discord edits the deferred message through the interaction token — no bot token needed for that.
async function followUp(env, token, data) {
  await fetch(`https://discord.com/api/v10/webhooks/${env.DISCORD_APP_ID}/${token}/messages/@original`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}

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
