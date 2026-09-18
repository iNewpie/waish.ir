#!/usr/bin/env node
/* ============================================================
   WAISH BOT RENDERER — draws the Discord bot's image cards.
   The Cloudflare worker (tools/discord.bot.js) collects the data, POSTs it here, gets a PNG back and attaches it to the
   reply. Cards are HTML/CSS (cards.mjs) screenshotted by one long-lived headless Chromium (Playwright). Skin renders are
   fetched here with a proper User-Agent (vzge.me insists on one) and inlined, so the page itself never touches the network.

   POST /render   header X-Render-Key: <RENDER_KEY>   body {"kind": "user"|"check"|"stats"|"skin"|"guild", "data": {...}}
                  → image/png (2× scale, ~150–400 KB), or 4xx/5xx with a text reason
   GET  /health   → "ok <n rendered>"
   Env: RENDER_KEY (from tools/proxy.env), RENDER_PORT (default 8080 — one of the ports Cloudflare Workers may fetch)
   Service: tools/waish-render.service
   ============================================================ */
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright';
import { CARDS, SIZE } from './cards.mjs';

const here = dirname(fileURLToPath(import.meta.url));
try {
  for (const ln of readFileSync(join(here, '..', 'proxy.env'), 'utf8').split('\n')) {
    const m = ln.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); if (m && process.env[m[1]] == null) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch (e) {}
const KEY = process.env.RENDER_KEY, PORT = Number(process.env.RENDER_PORT || 8080);
if (!KEY) { console.error('RENDER_KEY missing (tools/proxy.env)'); process.exit(1); }
const UA = 'waish-bot/1.0 (+https://waish.ir; hawremoradi100@outlook.com)';
const log = (...a) => console.log(new Date().toISOString(), ...a);

// ---- images: fetched once, kept 10 minutes, inlined as data: URIs ----
const imgCache = new Map();
async function inlineImages(html) {
  const urls = [...new Set([...html.matchAll(/src="(https?:\/\/[^"]+)"/g)].map(m => m[1]))];
  await Promise.all(urls.map(async u => {
    const hit = imgCache.get(u); if (hit && hit.t > Date.now()) return;
    try {
      const c = new AbortController(); const tm = setTimeout(() => c.abort(), 6000);
      const r = await fetch(u, { headers: { 'User-Agent': UA }, signal: c.signal }); clearTimeout(tm);
      if (!r.ok) throw new Error(r.status);
      const type = r.headers.get('content-type') || 'image/png';
      imgCache.set(u, { t: Date.now() + 600000, v: `data:${type};base64,${Buffer.from(await r.arrayBuffer()).toString('base64')}` });
    } catch (e) { log('image failed', u, e.message); imgCache.set(u, { t: Date.now() + 60000, v: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==' }); }
  }));
  return html.replace(/src="(https?:\/\/[^"]+)"/g, (m, u) => `src="${imgCache.get(u).v}"`);
}

// ---- one browser, one page, one render at a time (single-core box) ----
let browser, page, queue = Promise.resolve(), rendered = 0;
async function getPage() {
  if (page && !page.isClosed()) return page;
  browser = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] });
  browser.on('disconnected', () => { page = null; });
  page = await browser.newPage({ viewport: { width: 1100, height: 560 }, deviceScaleFactor: 2 });
  return page;
}
// fonts are inlined too (cards.mjs refers to fonts/*.woff2) — the page is about:blank and could not load files from disk
const FONT_CSS = new Map();
const inlineFonts = html => html.replace(/url\('fonts\/([^']+)'\)/g, (m, f) => { if (!FONT_CSS.has(f)) FONT_CSS.set(f, `url('data:font/woff2;base64,${readFileSync(join(here, 'fonts', f)).toString('base64')}')`); return FONT_CSS.get(f); });
function render(kind, data) {
  const job = queue.then(async () => {
    const [w, h] = SIZE[kind];
    const html = inlineFonts(await inlineImages(CARDS[kind](data)));
    const p = await getPage();
    await p.setViewportSize({ width: w, height: h });
    await p.setContent(html, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    const png = await p.screenshot({ type: 'png', clip: { x: 0, y: 0, width: w, height: h } });
    rendered++; return png;
  });
  queue = job.catch(() => {});
  return job;
}

createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') { res.end(`ok ${rendered} rendered`); return; }
  if (req.method !== 'POST' || req.url !== '/render') { res.writeHead(404); res.end('POST /render'); return; }
  if (req.headers['x-render-key'] !== KEY) { res.writeHead(401); res.end('bad key'); return; }
  let body = ''; req.on('data', c => { body += c; if (body.length > 65536) req.destroy(); });
  req.on('end', async () => {
    let j; try { j = JSON.parse(body); } catch (e) { res.writeHead(400); res.end('bad json'); return; }
    if (!CARDS[j.kind] || !j.data) { res.writeHead(400); res.end('unknown kind'); return; }
    const t0 = Date.now();
    try {
      const png = await render(j.kind, j.data);
      res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': png.length }); res.end(png);
      log(`${j.kind} ${j.data.ign || j.data.name || ''} ${png.length}B ${Date.now() - t0}ms`);
    } catch (e) { log('render failed', j.kind, e.message); res.writeHead(500); res.end('render failed: ' + e.message); }
  });
}).listen(PORT, '0.0.0.0', () => log(`render server on :${PORT}`));
getPage().then(() => log('chromium ready')).catch(e => log('chromium failed to start', e.message));
process.on('SIGTERM', async () => { log('stopping'); try { await browser?.close(); } catch (e) {} process.exit(0); });
process.on('SIGINT', () => process.emit('SIGTERM'));
