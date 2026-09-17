/* ============================================================
   WAISH API PROXY — a free Cloudflare Worker that keeps API keys off the public site and adds the
   CORS headers Mojang / Bordic don't send (browsers can't call them directly).
   apps/lookup.html calls:
     <worker-url>/convert?player=<name|uuid> → api.mojang.com (name → uuid) / api.minecraftservices.com/minecraft/profile/lookup (uuid → name): {ign, uuid}
     <worker-url>/mojang?name=<name>   → api.mojang.com (name → uuid) + sessionserver.mojang.com/session/minecraft/profile/<uuid>
     <worker-url>/mojang?uuid=<uuid>     the session-server profile is returned as-is, plus `textures` decoded from the base64 blob
     <worker-url>/player?uuid=<uuid>   → api.bordic.xyz/v3/cache/hypixel  (Bordic's keyless Hypixel cache — rank + stats, always its newest snapshot)
     <worker-url>/names?uuids=a,b,c    → api.minecraftservices.com uuid → current name, up to 40 per call (Bordic's cache only if Mojang errors)
     <worker-url>/guild?uuid=<uuid>    → netherapi.com/api/v2/guild (secret NETHER_KEY) or api.hypixel.net/v2/guild (secret HYPIXEL_KEY)
     <worker-url>/bordic?uuid=<uuid>   → bordic.xyz/api/cubelify          (anti-sniper tags, needs secret BORDIC_KEY)
   FRESHNESS — api.bordic.xyz sits behind a 24 h Cloudflare edge cache, so a plain request can hand back a day-old
   copy even when Bordic already holds newer stats. Every Bordic call here carries a per-minute `t` param that skips
   that edge copy, and our own copy of a player lives only 60 s: what you see is Bordic's latest snapshot
   (its `lastUpdated` is shown in the UI). Bordic itself only refreshes a player when its users meet them.
   Answers are cached (1 min profiles, 1 min stats, 1 h tags, 1 day names) and only served to your own site.

   SETUP (5 minutes, no card needed):
     1. https://dash.cloudflare.com → Workers & Pages → Create → "Hello World" worker.
     2. Replace its code with this file → Deploy.
     3. Worker → Settings → Variables and Secrets → add (all optional)
          BORDIC_KEY  = <your bordic.xyz key>                (for the anti-sniper tags box)
          NETHER_KEY  = <key from netherapi.com>           (guild lookups; does not expire daily — preferred)
          HYPIXEL_KEY = <key from developer.hypixel.net>   (guild lookups fallback — stats always come from Bordic)
     4. Copy the worker URL (https://something.workers.dev) into PROXY_URL in apps/lookup.html.
   Free tier: 100,000 requests/day.
   ============================================================ */
const ALLOWED = ['https://waish.ir', 'https://www.waish.ir', 'https://inewpie.github.io', 'http://155.117.127.81', 'http://localhost', 'http://127.0.0.1', 'null'];
const UA = { 'User-Agent': 'waish.ir lookup' };
const TTL = { mojang: 60, player: 60, guild: 600, tags: 3600, name: 86400, convert: 3600 };   // seconds
// Bordic's Hypixel cache. The `t` param changes every minute so Cloudflare's edge copy of api.bordic.xyz is bypassed.
const bordic = uuid => new Request(`https://api.bordic.xyz/v3/cache/hypixel?uuid=${uuid}&t=${Math.floor(Date.now() / 60000)}`, { headers: UA });
// PlayerDB relays Mojang's live session-server profile (same signed `properties` textures blob). Used when Mojang itself
// answers 403 to Cloudflare's IP ranges. Returns the same shape as /mojang: { success, id, name, properties, textures }.
async function playerdbProfile(who) {
  const r = await fetch(`https://playerdb.co/api/player/minecraft/${encodeURIComponent(who)}`, { headers: UA });
  let d = null; try { d = await r.json(); } catch (e) {}
  const pl = d && d.success && d.data && d.data.player;
  if (!pl) return { status: r.status === 200 || r.status === 404 || r.status === 400 ? 404 : 502, body: JSON.stringify({ success: false, cause: pl === null ? 'Player not found' : (d && d.message) || 'Player not found' }) };
  let textures = null; try { const prop = (pl.properties || []).find(p => p.name === 'textures'); if (prop) textures = JSON.parse(atob(prop.value)); } catch (e) {}
  if (!textures && pl.skin_texture) textures = { textures: { SKIN: { url: pl.skin_texture }, ...(pl.cape_texture ? { CAPE: { url: pl.cape_texture } } : {}) } };
  return { status: 200, body: JSON.stringify({ success: true, id: pl.raw_id, name: pl.username, properties: pl.properties || [], textures }) };
}
// Mojang IGN ⇄ UUID (https://minecraft.wiki/w/Mojang_API): {success, ign, uuid} — 404 for an unknown player, 400 for a malformed one.
const convert = async player => {
  const id = player.replace(/-/g, '').toLowerCase(), byId = /^[0-9a-f]{32}$/.test(id);
  if (!byId && !/^[A-Za-z0-9_]{1,16}$/.test(player)) return { status: 400, d: { success: false, cause: 'Malformed field [player]' } };
  const r = await fetch(byId ? `https://api.minecraftservices.com/minecraft/profile/lookup/${id}` : `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(player)}`, { headers: UA });
  if (r.status === 204 || r.status === 404) return { status: 404, d: { success: false, cause: 'No data found [player]' } };
  if (r.status === 403) {   // Mojang blocks Cloudflare's network → PlayerDB
    const p = await playerdbProfile(player); const j = JSON.parse(p.body);
    return j.success ? { status: 200, d: { success: true, ign: j.name, uuid: j.id } } : { status: p.status, d: { success: false, cause: j.cause } };
  }
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
          if (status === 403) return playerdbProfile(gname);   // Mojang blocks Cloudflare's network → PlayerDB (name → live profile)
          if (status !== 200) return { status, body: JSON.stringify(d) };
          uuid = d.uuid;
        }
        const r = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`, { headers: UA });
        if (r.status === 204 || r.status === 404) return { status: 404, body: JSON.stringify({ success: false, cause: 'Player not found' }) };
        if (r.status === 429) return { status: 429, body: JSON.stringify({ success: false, cause: 'Mojang session server is rate limited — try again in a minute' }) };
        if (r.status === 403) return playerdbProfile(uuid);   // Mojang blocks Cloudflare's network → PlayerDB relays the same signed profile
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
