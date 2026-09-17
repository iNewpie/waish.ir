/* WAISH API PROXY - that keeps API keys off the public site */
const ALLOWED = ['https://waish.ir', 'https://www.waish.ir', 'http://localhost', 'http://127.0.0.1', 'null'];
const UA = { 'User-Agent': 'waish.ir lookup' };
const TTL = { mojang: 60, player: 60, guild: 600, tags: 3600, name: 86400, convert: 3600 };   // seconds
// Bordic's Hypixel cache. The `t` param changes every minute so Cloudflare's edge copy of api.bordic.xyz is bypassed.
const bordic = uuid => new Request(`https://api.bordic.xyz/v3/cache/hypixel?uuid=${uuid}&t=${Math.floor(Date.now() / 60000)}`, { headers: UA });
// Mojang IGN ⇄ UUID (https://minecraft.wiki/w/Mojang_API): {success, ign, uuid} — 404 for an unknown player, 400 for a malformed one.
const convert = async player => {
  const id = player.replace(/-/g, '').toLowerCase(), byId = /^[0-9a-f]{32}$/.test(id);
  if (!byId && !/^[A-Za-z0-9_]{1,16}$/.test(player)) return { status: 400, d: { success: false, cause: 'Malformed field [player]' } };
  const r = await fetch(byId ? `https://api.minecraftservices.com/minecraft/profile/lookup/${id}` : `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(player)}`, { headers: UA });
  if (r.status === 204 || r.status === 404) return { status: 404, d: { success: false, cause: 'No data found [player]' } };
  let j = null; try { j = await r.json(); } catch (e) {}
  if (!r.ok || !j || !j.id) return { status: r.ok ? 502 : r.status, d: { success: false, cause: (j && j.errorMessage) || `Mojang lookup failed (${r.status})` } };
  return { status: 200, d: { success: true, ign: j.name, uuid: j.id.replace(/-/g, '').toLowerCase() } };
};

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const ok = ALLOWED.some(a => origin === a || origin.startsWith(a + ':'));
    const cors = { 'Access-Control-Allow-Origin': ok ? origin : 'https://waish.ir', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Max-Age': '86400', 'Vary': 'Origin' };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const url = new URL(request.url);
    let uuid = (url.searchParams.get('uuid') || url.searchParams.get('player') || '').replace(/-/g, '').toLowerCase();
    const gname = (url.searchParams.get('name') || '').slice(0, 32);
    const player = (url.searchParams.get('player') || '').trim().slice(0, 36);   // /convert: an IGN or a uuid (dashed or not)
    if (!['/mojang', '/player', '/names', '/bordic', '/guild', '/convert'].includes(url.pathname)) return json({ success: false, cause: 'Use /mojang, /player, /guild or /bordic with ?uuid=<uuid> (mojang and guild also take ?name=), /convert?player=<name|uuid>, or /names?uuids=a,b,c' }, 404, cors);
    const byName = (url.pathname === '/guild' || url.pathname === '/mojang') && gname;
    if (url.pathname === '/convert' && !/^([A-Za-z0-9_]{1,16}|[0-9a-f]{32}|[0-9a-f-]{36})$/i.test(player)) return json({ success: false, cause: 'Pass ?player=<name or uuid>' }, 400, cors);
    if (!['/names', '/convert'].includes(url.pathname) && !byName && !/^[0-9a-f]{32}$/.test(uuid)) return json({ success: false, cause: 'Invalid UUID' }, 400, cors);

    const cache = globalThis.caches && caches.default;
    const cached = async (key, ttl, make) => {
      const k = new Request(`https://waish-proxy.cache${key}`);
      let res = cache && await cache.match(k);
      if (!res) {
        const { status, body } = await make();
        res = new Response(body, { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${ttl}` } });
        if (status === 200 && cache) await cache.put(k, res.clone());
      }
      return res;
    };
    const pass = async (req) => { const up = await fetch(req); return { status: up.status, body: await up.text() }; };

    let res;
    if (url.pathname === '/mojang') {
      // name → uuid (api.mojang.com), then the session-server profile: textures come base64-encoded in properties[0].value
      res = await cached(`/mojang/${gname ? 'n/' + gname.toLowerCase() : uuid}`, TTL.mojang, async () => {
        if (gname) {
          if (!/^[A-Za-z0-9_]{1,16}$/.test(gname)) return { status: 400, body: JSON.stringify({ success: false, cause: 'Invalid name' }) };
          const { status, d } = await convert(gname);
          if (status === 404) return { status: 404, body: JSON.stringify({ success: false, cause: 'Player not found' }) };
          if (status === 429) return { status: 429, body: JSON.stringify({ success: false, cause: 'Mojang API is rate limited — try again in a minute' }) };
          if (status !== 200) return { status, body: JSON.stringify(d) };
          uuid = d.uuid;
        }
        const r = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`, { headers: UA });
        if (r.status === 204 || r.status === 404) return { status: 404, body: JSON.stringify({ success: false, cause: 'Player not found' }) };
        if (r.status === 429) return { status: 429, body: JSON.stringify({ success: false, cause: 'Mojang session server is rate limited — try again in a minute' }) };
        if (!r.ok) return { status: r.status, body: JSON.stringify({ success: false, cause: 'Session server failed (' + r.status + ')' }) };
        const d = await r.json(); let textures = null;
        try { const prop = (d.properties || []).find(p => p.name === 'textures'); if (prop) textures = JSON.parse(atob(prop.value)); } catch (e) {}
        return { status: 200, body: JSON.stringify({ success: true, ...d, textures }) };
      });
    } else if (url.pathname === '/player') {
      // Bordic's newest snapshot (see FRESHNESS above). A player Bordic has never met answers 404 "No data found [uuid]".
      res = await cached(`/player/${uuid}`, TTL.player, () => pass(bordic(uuid)));
    } else if (url.pathname === '/names') {
      // uuid → current name, read from the same Bordic cache (displayname). Unknown uuids come back as null.
      const list = [...new Set((url.searchParams.get('uuids') || '').toLowerCase().split(',').map(s => s.trim().replace(/-/g, '')).filter(s => /^[0-9a-f]{32}$/.test(s)))].slice(0, 40);
      if (!list.length) return json({ success: false, cause: 'Pass ?uuids=<uuid>,<uuid>,… (up to 40)' }, 400, cors);
      const names = {};
      await Promise.all(list.map(async u => {
        try {
          const r = await cached(`/name/${u}`, TTL.name, async () => {
            let n = null, st = 0; try { const c = await convert(u); st = c.status; n = c.d.success && c.d.ign; } catch (e) {}
            if (!n && st !== 404) {   // Mojang errored (rate limit / outage) → Bordic's Hypixel cache as a stand-in
              const up = await fetch(bordic(u)); let d = null; try { d = await up.json(); } catch (e) {}
              n = d && d.success && d.player && (d.player.displayname || d.player.playername);
            }
            return { status: n ? 200 : 404, body: JSON.stringify({ success: !!n, name: n || null }) };
          });
          names[u] = (await r.json()).name || null;
        } catch (e) { names[u] = null; }
      }));
      res = new Response(JSON.stringify({ success: true, names }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${TTL.name}` } });
    } else if (url.pathname === '/convert') {   // IGN ⇄ UUID through Mojang; answers {success, ign, uuid}
      res = await cached(`/convert/${player.toLowerCase().replace(/-/g, '')}`, TTL.convert, async () => { const { status, d } = await convert(player); return { status, body: JSON.stringify(d) }; });
    } else if (url.pathname === '/guild') {   // guild data only exists on Hypixel, not on Bordic
      const q = gname ? `name=${encodeURIComponent(gname)}` : `player=${uuid}`;
      if (!env.NETHER_KEY && !env.HYPIXEL_KEY) return json({ success: false, cause: 'Guild lookups need the NETHER_KEY (netherapi.com) or HYPIXEL_KEY secret on the worker' }, 501, cors);
      const [gbase, gkey] = env.NETHER_KEY ? ['https://netherapi.com/api/v2/guild', env.NETHER_KEY] : ['https://api.hypixel.net/v2/guild', env.HYPIXEL_KEY];
      res = await cached(`/guild/${gname ? 'n/' + encodeURIComponent(gname.toLowerCase()) : uuid}`, TTL.guild, async () => {
        const { status, body } = await pass(new Request(`${gbase}?${q}`, { headers: { 'API-Key': gkey } }));
        let d = null; try { d = JSON.parse(body); } catch (e) {}
        if (!d) return { status: 502, body: JSON.stringify({ success: false, cause: `Guild API failed (${status})` }) };
        if (!d.success && !d.cause) d.cause = d.error || `Guild API failed (${status})`;   // NetherAPI says `error`, Hypixel says `cause`
        return { status, body: JSON.stringify(d) };
      });
    } else {
      if (!env.BORDIC_KEY) return json({ success: false, cause: 'BORDIC_KEY secret is not set on the worker' }, 500, cors);
      res = await cached(`/bordic/${uuid}`, TTL.tags, () => pass(new Request(`https://bordic.xyz/api/cubelify?id=${uuid}&key=${encodeURIComponent(env.BORDIC_KEY)}`, { headers: UA })));
    }
    const out = new Response(res.body, res); Object.entries(cors).forEach(([k, v]) => out.headers.set(k, v));
    return out;
  },
};
function json(obj, status, cors) { return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...cors } }); }
