#!/usr/bin/env python3
"""
WAISH SITE SERVER — static files + the /api proxy, one process, one origin.

Serves the site folder (the parent of this file) exactly like `python3 -m http.server`, and answers the
same routes as tools/proxy.worker.js under /api so the User Lookup app works without a Cloudflare worker:

  Names, skins and capes come from Mojang's public API (https://minecraft.wiki/w/Mojang_API); Bordic is only
  used for Hypixel stats.
    /api/mojang?name=<name>   → api.mojang.com/users/profiles/minecraft/<name>  (name → uuid)
                                + sessionserver.mojang.com/session/minecraft/profile/<uuid>  (skin, cape, model — live)
    /api/mojang?uuid=<uuid>     the session-server profile, plus `textures` decoded from the base64 blob
    /api/convert?player=<x>   → name → uuid (api.mojang.com) or uuid → name (api.minecraftservices.com/minecraft/profile/lookup/<uuid>)
    /api/player?uuid=<uuid>   → api.bordic.xyz/v3/cache/hypixel         (Bordic's Hypixel cache, newest snapshot)
    /api/names?uuids=a,b,c    → api.minecraftservices.com uuid → current name, up to 40 (Bordic's cache only if Mojang errors)
    /api/guild?uuid=|name=    → netherapi.com/api/v2/guild (NETHER_KEY) or api.hypixel.net/v2/guild (HYPIXEL_KEY)
    /api/bordic?uuid=<uuid>   → bordic.xyz/api/cubelify                 (anti-sniper tags, needs BORDIC_KEY)

Keys come from tools/proxy.env (lines like HYPIXEL_KEY=…), re-read whenever that file changes — no restart needed.
Pages, scripts and styles are sent with `Cache-Control: no-cache` so a browser always revalidates them
and picks up edits immediately; images and fonts may be cached for an hour.

Run:  python3 tools/site-server.py --port 8000
"""
import argparse, base64, json, os, re, sys, threading, time, urllib.error, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = 'waish.ir lookup'
TTL = {'mojang': 60, 'player': 60, 'guild': 600, 'tags': 3600, 'name': 86400, 'convert': 3600}   # seconds
HIDDEN = re.compile(r'^/(\.git|\.claude|tools|node_modules)(/|$)|\.(zip|env|py|log)$')
NO_CACHE = ('.html', '.js', '.css', '.json')
UUID32 = re.compile(r'^[0-9a-f]{32}$')
NAME = re.compile(r'^[A-Za-z0-9_]{1,16}$')

# ---------- tiny TTL cache ----------
_cache, _lock = {}, threading.Lock()
def cached(key, ttl, make):
    now = time.time()
    with _lock:
        hit = _cache.get(key)
        if hit and hit[0] > now: return hit[1]
    val = make()
    if val[0] == 200:
        with _lock:
            _cache[key] = (now + ttl, val)
            if len(_cache) > 5000:   # keep memory bounded
                for k in [k for k, v in _cache.items() if v[0] <= now]: _cache.pop(k, None)
    return val

# ---------- upstream helpers ----------
def http_get(url, headers=None, timeout=12):
    """→ (status, text). Network errors become 502."""
    req = urllib.request.Request(url, headers={'User-Agent': UA, **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r: return r.status, r.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as e:
        try: body = e.read().decode('utf-8', 'replace')
        except Exception: body = ''
        return e.code, body
    except Exception as e:
        return 502, json.dumps({'success': False, 'cause': f'upstream unreachable: {e.__class__.__name__}'})

def jl(text):
    try: return json.loads(text)
    except Exception: return None

def out(status, obj): return status, json.dumps(obj)

def bordic_cache(uuid):
    # the `t` param changes every minute so Cloudflare's 24 h edge copy of api.bordic.xyz is bypassed
    return http_get(f'https://api.bordic.xyz/v3/cache/hypixel?uuid={uuid}&t={int(time.time() // 60)}')

def convert(player):
    """Mojang IGN ⇄ UUID → (status, {success, ign, uuid}). 404 = unknown player, 400 = malformed, 429 = rate limited."""
    pl = player.replace('-', '').lower()
    if UUID32.match(pl): st, body = http_get(f'https://api.minecraftservices.com/minecraft/profile/lookup/{pl}')
    elif NAME.match(player): st, body = http_get(f'https://api.mojang.com/users/profiles/minecraft/{urllib.parse.quote(player)}')
    else: return 400, {'success': False, 'cause': 'Malformed field [player]'}
    if st in (204, 404): return 404, {'success': False, 'cause': 'No data found [player]'}
    d = jl(body) or {}
    if st != 200 or not d.get('id'): return (st if st != 200 else 502), {'success': False, 'cause': (d.get('errorMessage') or f'Mojang lookup failed ({st})')}
    return 200, {'success': True, 'ign': d.get('name'), 'uuid': d['id'].replace('-', '').lower()}

# ---------- routes ----------
def route_mojang(q):
    name, uuid = q.get('name', '').strip(), q.get('uuid', '').replace('-', '').lower().strip()
    if name:
        if not NAME.match(name): return out(400, {'success': False, 'cause': 'Invalid name'})
        key = '/mojang/n/' + name.lower()
    elif UUID32.match(uuid): key = '/mojang/' + uuid
    else: return out(400, {'success': False, 'cause': 'Invalid UUID'})

    def make():
        u = uuid
        if name:   # name → uuid, Mojang's own lookup
            st, d = convert(name)
            if st == 404: return out(404, {'success': False, 'cause': 'Player not found'})
            if st == 429: return out(429, {'success': False, 'cause': 'Mojang API is rate limited — try again in a minute'})
            if st != 200: return out(st, d)
            u = d['uuid']
        st, body = http_get(f'https://sessionserver.mojang.com/session/minecraft/profile/{u}')
        if st in (204, 404): return out(404, {'success': False, 'cause': 'Player not found'})
        if st == 429: return out(429, {'success': False, 'cause': 'Mojang session server is rate limited — try again in a minute'})
        if st != 200: return out(st, {'success': False, 'cause': f'Session server failed ({st})'})
        d = jl(body) or {}
        textures = None
        try:
            prop = next((p for p in d.get('properties', []) if p.get('name') == 'textures'), None)
            if prop: textures = json.loads(base64.b64decode(prop['value']))
        except Exception: pass
        return out(200, {'success': True, **d, 'textures': textures})
    return cached(key, TTL['mojang'], make)

def route_convert(q):
    player = q.get('player', '').strip()[:36]
    if not re.match(r'^([A-Za-z0-9_]{1,16}|[0-9a-f]{32}|[0-9a-f-]{36})$', player, re.I): return out(400, {'success': False, 'cause': 'Pass ?player=<name or uuid>'})
    def make():
        st, d = convert(player); return st, json.dumps(d)
    return cached('/convert/' + player.lower().replace('-', ''), TTL['convert'], make)

def route_player(q):
    uuid = q.get('uuid', '').replace('-', '').lower()
    if not UUID32.match(uuid): return out(400, {'success': False, 'cause': 'Invalid UUID'})
    return cached('/player/' + uuid, TTL['player'], lambda: bordic_cache(uuid))

def one_name(u):
    def make():
        st, c = convert(u); n = c.get('ign') if c.get('success') else None
        if not n and st not in (404, 400):   # Mojang errored (rate limit / outage) → Bordic's Hypixel cache as a stand-in
            st, body = bordic_cache(u); d = jl(body) or {}
            n = d.get('success') and ((d.get('player') or {}).get('displayname') or (d.get('player') or {}).get('playername'))
        return out(200 if n else 404, {'success': bool(n), 'name': n or None})
    return (jl(cached('/name/' + u, TTL['name'], make)[1]) or {}).get('name')

_pool = ThreadPoolExecutor(max_workers=8)
def route_names(q):
    raw = q.get('uuids', '').lower()
    seen, lst = set(), []
    for s in raw.split(','):
        s = s.strip().replace('-', '')
        if UUID32.match(s) and s not in seen: seen.add(s); lst.append(s)
    lst = lst[:40]
    if not lst: return out(400, {'success': False, 'cause': 'Pass ?uuids=<uuid>,<uuid>,… (up to 40)'})
    names = dict(zip(lst, _pool.map(one_name, lst)))
    return out(200, {'success': True, 'names': names})

_env_state = {'mtime': 0, 'vals': {}}
def secret(name):
    """HYPIXEL_KEY / BORDIC_KEY: the environment, else tools/proxy.env — re-read whenever that file changes,
    so a key pasted into it works on the next lookup without restarting the server."""
    if os.environ.get(name): return os.environ[name]
    path = os.path.join(ROOT, 'tools', 'proxy.env')
    try: m = os.stat(path).st_mtime
    except OSError: return ''
    if m != _env_state['mtime']:
        vals = {}
        try:
            with open(path) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        k, v = line.split('=', 1); vals[k.strip()] = v.split('#', 1)[0].strip().strip('"').strip("'")
        except OSError: pass
        _env_state.update(mtime=m, vals=vals)
    return _env_state['vals'].get(name, '')

def route_guild(q):
    # Guild data only exists on Hypixel. NetherAPI (https://netherapi.com) mirrors /v2/guild under a key that does not
    # expire daily, so NETHER_KEY is preferred; HYPIXEL_KEY (developer.hypixel.net) still works as a fallback.
    nether, hyp = secret('NETHER_KEY'), secret('HYPIXEL_KEY')
    if not nether and not hyp: return out(501, {'success': False, 'cause': 'Guild lookups need NETHER_KEY (netherapi.com) or HYPIXEL_KEY in tools/proxy.env'})
    base, key = ('https://netherapi.com/api/v2/guild', nether) if nether else ('https://api.hypixel.net/v2/guild', hyp)
    name, uuid = q.get('name', '').strip()[:32], q.get('uuid', '').replace('-', '').lower()
    if name: qs, ck = 'name=' + urllib.parse.quote(name), '/guild/n/' + name.lower()
    elif UUID32.match(uuid): qs, ck = 'player=' + uuid, '/guild/' + uuid
    else: return out(400, {'success': False, 'cause': 'Invalid UUID'})
    def make():
        st, body = http_get(f'{base}?{qs}', {'API-Key': key}); d = jl(body)
        if d is None: return out(502, {'success': False, 'cause': f'Guild API failed ({st})'})
        if not d.get('success') and 'cause' not in d: d['cause'] = d.get('error') or f'Guild API failed ({st})'   # NetherAPI says `error`, Hypixel says `cause`
        return st, json.dumps(d)
    return cached(ck, TTL['guild'], make)

def route_bordic(q):
    key = secret('BORDIC_KEY')
    if not key: return out(500, {'success': False, 'cause': 'BORDIC_KEY secret is not set (tools/proxy.env)'})
    uuid = q.get('uuid', '').replace('-', '').lower()
    if not UUID32.match(uuid): return out(400, {'success': False, 'cause': 'Invalid UUID'})
    return cached('/bordic/' + uuid, TTL['tags'], lambda: http_get(f'https://bordic.xyz/api/cubelify?id={uuid}&key={urllib.parse.quote(key)}'))

ROUTES = {'mojang': route_mojang, 'convert': route_convert, 'player': route_player, 'names': route_names, 'guild': route_guild, 'bordic': route_bordic}

# ---------- handler ----------
class Handler(SimpleHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'
    def __init__(self, *a, **kw): super().__init__(*a, directory=ROOT, **kw)

    def send_response(self, code, message=None):
        self._status = code; super().send_response(code, message)

    def do_GET(self):
        u = urllib.parse.urlsplit(self.path)
        if u.path == '/api/track': return self.serve_track(urllib.parse.parse_qs(u.query).get('f', [''])[0])
        if u.path.startswith('/api/'):
            fn = ROUTES.get(u.path[5:].strip('/'))
            q = {k: v[0] for k, v in urllib.parse.parse_qs(u.query).items()}
            if not fn: status, body = out(404, {'success': False, 'cause': 'Use /api/mojang, /api/convert, /api/player, /api/names, /api/guild or /api/bordic'})
            else:
                try: status, body = fn(q)
                except Exception as e: status, body = out(500, {'success': False, 'cause': f'proxy error: {e.__class__.__name__}'})
            data = body.encode()
            self.send_response(status); self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(data))); self.send_header('Cache-Control', 'no-store'); self.end_headers()
            self.wfile.write(data); return
        if HIDDEN.search(u.path): self.send_error(HTTPStatus.NOT_FOUND); return
        if self.headers.get('Range') and self.serve_range(): return
        super().do_GET()

    def serve_track(self, name):
        """Music for the player: the mp3 bytes as application/octet-stream on a URL with no .mp3 in it, fetched by
        script and played from memory. Download managers (IDM etc.) hook media URLs and pop a download dialog
        instead of letting the page play; they leave plain binary fetches alone."""
        if not re.match(r'^[a-z0-9-]+\.mp3$', name): self.send_error(HTTPStatus.NOT_FOUND); return
        path = os.path.join(ROOT, 'assets', 'music', name)
        if not os.path.isfile(path): self.send_error(HTTPStatus.NOT_FOUND); return
        size = os.path.getsize(path); start, end = 0, size - 1
        m = re.match(r'bytes=(\d+)-(\d*)$', self.headers.get('Range', ''))   # the player seeks by asking for the rest of the file from a byte offset
        if m: start = min(int(m.group(1)), size - 1); end = min(int(m.group(2)), size - 1) if m.group(2) else size - 1
        self.send_response(HTTPStatus.PARTIAL_CONTENT if m else HTTPStatus.OK); self.send_header('Content-Type', 'application/octet-stream')
        if m: self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.send_header('X-File-Size', str(size)); self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Length', str(end - start + 1)); self.send_header('Cache-Control', 'public, max-age=86400'); self.end_headers()
        with open(path, 'rb') as f:
            f.seek(start); left = end - start + 1
            while left > 0:
                chunk = f.read(min(65536, left))
                if not chunk: break
                try: self.wfile.write(chunk)
                except (BrokenPipeError, ConnectionResetError): break
                left -= len(chunk)

    def serve_range(self):
        """HTTP Range support (bytes=a-b) so <audio>/<video> can seek — the stock file server has none."""
        path = self.translate_path(self.path)
        if os.path.isdir(path) or not os.path.isfile(path): return False
        m = re.match(r'bytes=(\d*)-(\d*)$', self.headers.get('Range', ''))
        if not m: return False
        size = os.path.getsize(path); a, b = m.group(1), m.group(2)
        if a == '' and b == '': return False
        if a == '': start, end = max(0, size - int(b)), size - 1          # bytes=-500 → last 500 bytes
        else: start, end = int(a), (min(int(b), size - 1) if b else size - 1)
        if start >= size or start > end:
            self.send_response(HTTPStatus.REQUESTED_RANGE_NOT_SATISFIABLE); self.send_header('Content-Range', f'bytes */{size}'); self.end_headers(); return True
        self.send_response(HTTPStatus.PARTIAL_CONTENT)
        self.send_header('Content-Type', self.guess_type(path)); self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Range', f'bytes {start}-{end}/{size}'); self.send_header('Content-Length', str(end - start + 1))
        self.send_header('Last-Modified', self.date_time_string(os.stat(path).st_mtime)); self.end_headers()
        with open(path, 'rb') as f:
            f.seek(start); left = end - start + 1
            while left > 0:
                chunk = f.read(min(65536, left))
                if not chunk: break
                try: self.wfile.write(chunk)
                except (BrokenPipeError, ConnectionResetError): break
                left -= len(chunk)
        return True

    def end_headers(self):
        p = urllib.parse.urlsplit(self.path).path
        if p.endswith(('.mp3', '.mp4', '.m4a', '.ogg', '.wav', '.webm')) and getattr(self, '_status', 200) == 200: self.send_header('Accept-Ranges', 'bytes')
        if not p.startswith('/api/'):
            fresh = getattr(self, '_status', 200) >= 400 or p.endswith('/') or p.endswith(NO_CACHE) or '.' not in os.path.basename(p)
            self.send_header('Cache-Control', 'no-cache' if fresh else 'public, max-age=3600')
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stdout.write('%s %s\n' % (self.address_string(), fmt % args)); sys.stdout.flush()

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--port', type=int, default=8000); ap.add_argument('--bind', default='0.0.0.0')
    a = ap.parse_args()
    print(f'waish site + /api on http://{a.bind}:{a.port}  (root {ROOT})', flush=True)
    ThreadingHTTPServer((a.bind, a.port), Handler).serve_forever()
