/* ============================================================
   TERMINAL ENGINE — shared by index.html (mini) and terminal.html (full)
   - anything starting with "/" is a command
   - anything else goes to the assistant (js/llm.js + js/llm-db.js)
   - every line fades in; assistant answers fade in word by word
   ============================================================ */
window.initTerminal = function ({ body, input, mode = 'mini' }) {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const isFA = s => /[؀-ۿ]/.test(s);
  const history = []; let hIdx = -1;
  const T = window.I18N ? window.I18N.t : x => x;
  // /check: the same sources as the User Lookup app (apps/lookup.html) — Seraph straight from the browser (it sends
  // CORS headers), Urchin + Mojang name→uuid through the proxy (tools/site-server.py locally, the Cloudflare worker on waish.ir).
  const SERAPH_API_KEY = 'cac7921b-ef85-498f-81c6-7675300a3cd6';
  const WORKER = 'https://waish-proxy.danesh2242.workers.dev';
  const PROXY = /^(localhost|127\.0\.0\.1|155\.117\.127\.81)$/.test(location.hostname) && location.protocol !== 'file:' ? '/api' : WORKER;

  function print(html, cls) {
    const d = document.createElement('div');
    // in Persian UI mode, lines that contain Persian text flow right-to-left
    if (window.I18N && window.I18N.lang === 'fa' && !/\bfa\b/.test(cls || '') && /[\u0600-\u06FF]/.test(html.replace(/<[^>]+>/g, ''))) cls = (cls || '') + ' fa';
    d.className = 'line' + (cls ? ' ' + cls : '');
    d.innerHTML = html;
    body.appendChild(d); body.scrollTop = body.scrollHeight;
    return d;
  }
  function echo(c) {
    print(`<span class="prompt-sym">➜</span> <span class="prompt-path">~</span> <span class="cmd-echo${isFA(c) ? ' fa' : ''}">${esc(c)}</span>`);
  }
  // assistant answer: word-by-word fade. Keeps line breaks from the DB.
  async function fadeWords(text, lang, emoji) {
    const d = print('', 'assistant' + (lang === 'fa' ? ' fa' : ''));
    if (emoji) { const e = document.createElement('span'); e.className = 'emo'; e.textContent = emoji; d.appendChild(e); }
    const lines = text.split('\n');
    let i = 0;
    const step = Math.max(12, Math.min(38, 1400 / Math.max(1, text.split(/\s+/).length))); // total ≈ 1.4s
    lines.forEach((ln, li) => {
      ln.split(' ').forEach((w, wi) => {
        if (w === '') { d.appendChild(document.createTextNode(' ')); return; }
        const s = document.createElement('span');
        s.className = 'wd'; s.style.animationDelay = (i++ * step) + 'ms';
        // in RTL text a leading '/' or '.' is bidi-neutral and gets flipped ("/help" → "help/"); isolate ASCII words as LTR
        if (lang === 'fa' && /^[\x21-\x7E]+$/.test(w)) s.dir = 'ltr';
        s.textContent = w; d.appendChild(s);
        d.appendChild(document.createTextNode(' '));
      });
      if (li < lines.length - 1) d.appendChild(document.createElement('br'));
    });
    body.scrollTop = body.scrollHeight;
    await sleep(i * step + 200);
  }

  // Hypixel Tools apps — the same actions as the Discord bot's /compare /prestige /ratio /leaderboard /status.
  // Inside the computer: open the app window on that query; on the plain terminal page: jump to computer.html#app?query.
  const openTool = (app, label, query, shown) => {
    if (window.DESKTOP) { window.DESKTOP.open(app, null, query || undefined); print(`<span class="out-green">✔</span> ${T('opened')} <span class="out-blue">${label}</span>${shown ? ` → <span class="out-cyan">${esc(shown)}</span>` : ''}`); return; }
    print(`${T('opening')} <span class="out-blue">${label}</span>${shown ? ` → <span class="out-cyan">${esc(shown)}</span>` : ''}…`, 'out-dim');
    setTimeout(() => location.href = `computer.html#${app}${query ? '?' + query : ''}`, 350);
  };
  const COMMANDS = {
    help() {
      print(`${T('Commands start with')} <span class="out-red">/</span>${T('. Anything else is a question for the assistant (English or فارسی).')}`, 'out-dim');
      const rows = [
        ['/about', 'who Waish is'],
        ['/projects', 'list his work'],
        ['/lunamc', 'the Minecraft server'],
        ['/ip', 'copy the LunaMC server IP'],
        ['/clutchping', 'the ping-reduction service'],
        ['/wbio', 'the bio-link page service'],
        ['/story', 'the full Waish story (/story fa for Persian)'],
        ['/setup', 'PC / stream setup'],
        ['/aboutme', 'open the About Me page (setup, packs, settings)'],
        ['/socials', 'where to find Waish'],
        ['/contact', 'how to reach him'],
        ['/clear', 'clear the screen'],
      ];
      rows.push(['/check <user>', 'is a Minecraft player blacklisted? (Seraph + Urchin)'], ['/user <user>', 'full profile: skin, Hypixel, guild, blacklists'], ['/discord', 'the Discord server + the waish bot']);
      rows.push(['/compare <a> <b>', 'two Hypixel players side by side'], ['/prestige <user>', 'stars & XP to the next prestige'], ['/ratio <user>', 'FKDR / WLR / BBLR / KDR targets'], ['/leaderboard <guild>', 'top members by weekly XP'], ['/status <server>', 'is a Minecraft server online?'], ['/tools', 'the Hypixel Tools folder'], ['/cps', 'clicks-per-second test'], ['/notepad', 'notes, saved in your browser']);
      if (mode === 'full') rows.push(['/open <app>', 'open an app window (see /apps)'], ['/apps', 'list the apps on this computer'], ['/home', 'back to the main site']);
      else rows.push(['/computer', 'open the computer (desktop + full terminal)']);
      rows.forEach(([c, d]) => print(`  <span class="out-blue">${esc(c.padEnd(20))}</span> ${T(d)}`));
      print(`\n${T('Example:')} <span class="out-yellow">what mouse do you use?</span>  ·  <span class="out-yellow">ستاپت چیه؟</span>  ·  <span class="out-yellow">how does tcp work</span>`, 'out-dim');
    },
    about() { print(`Waish — server admin, builder, content creator.`); print(`Runs LunaMC, builds ClutchPing, streams on Aparat & YouTube, and the infra behind all of it.`, 'out-dim'); },
    projects() {
      const list = window.PROJECTS || [
        { name: 'LunaMC', desc: 'Persian-language Minecraft server.' },
        { name: 'ClutchPing', desc: 'Ping reduction for gamers — clutchping.com' },
        { name: 'wbio.ir', desc: 'Bio-link pages — one link for every social.' },
        { name: 'Content', desc: 'Streams & videos on Aparat and YouTube.' },
        { name: 'This terminal', desc: 'Offline assistant on a local knowledge base.' },
      ];
      list.forEach(p => print(`<span class="out-red">●</span> <span class="out-blue">${p.name}</span> <span class="out-dim">— ${p.desc}</span>`));
      print(window.DESKTOP ? `Open one: <span class="out-blue">/open lunamc</span> · <span class="out-blue">/open projects</span>` : `Full pages: <span class="out-blue">projects.html</span>`, 'out-dim');
    },
    lunamc() { print(`<span class="out-cyan">LunaMC</span> — Persian-language Minecraft server.`); print(`Bedwars, custom plugins, active community.`, 'out-dim'); print(`IP: <span class="out-cyan">Play.LunaMC.iR</span>  <span class="out-dim">(type /ip to copy)</span>`); },
    ip() { navigator.clipboard?.writeText('Play.LunaMC.iR'); print(`<span class="out-green">✔</span> copied <span class="out-cyan">Play.LunaMC.iR</span> to clipboard`); },
    clutchping() { print(`<span class="out-cyan">⚡ ClutchPing</span> — lower ping for gamers.`); print(`Relay-based network optimization. Started with LunaMC, expanding to every game.`, 'out-dim'); print(`<span class="out-blue">→ clutchping.com</span>`); },
    wbio() { print(`<span class="out-cyan">🐰 wbio.ir</span> — bio-link pages, made for Iran.`); print(`One link for every social: 20 themes, live Valorant / Minecraft / Discord cards, effects, music, your own domain. Free to start, Plus / Pro / Enterprise plans, runs on Cloudflare Workers.`, 'out-dim'); print(`<span class="out-blue">→ wbio.ir</span>`); },
    setup() {
      print(`<span class="out-yellow">${T('Stream / recording setup')}</span>`);
      [
        ['keyboard', 'fully customized — Akko Cream Blue springs → Glorious Panda, lubed'],
        ['mice', 'Lamzu Atlantis Pro (4K) · Glorious Model O Wireless · Endgame XM2we · Bloody A90/A91/A60/V8M/ABedless/A70'],
        ['audio', 'SteelSeries Arctis Pro · IEMs: Simgot EM6L, Moondrop Aria / Aria 2 / LAN 2 / May'],
        ['mousepad', 'Wraith Hybrid (Aim) · 3× Jadookb deskmats'],
        ['mic', 'HyperX QuadCast S'],
        ['monitor', 'Asus 165 Hz'],
        ['pc', 'i5-9400F · GTX 1050 Ti · 16 GB DDR4 · 2× SSD + 2× HDD'],
        ['chair', 'a random DxRacer'],
      ].forEach(([k, v]) => print(`  <span class="out-blue">${k.padEnd(10)}</span> <span class="out-dim">${v}</span>`));
      print(`${T('Full page:')} <span class="out-blue">/aboutme</span>`, 'out-dim');
    },
    async story(arg) {
      const lang = /^(fa|persian|فارسی)/i.test(arg || '') || /[\u0600-\u06FF]/.test(arg || '') ? 'fa' : 'en';
      const paras = (window.WAISH_DB.story || {})[lang] || [];
      if (!paras.length) { print(`no story yet`, 'out-dim'); return; }
      print(lang === 'fa' ? `<span class="out-yellow">داستان ویش</span> <span class="out-dim">— ${paras.length} بخش</span>` : `<span class="out-yellow">The Waish story</span> <span class="out-dim">— ${paras.length} parts</span>`, lang === 'fa' ? 'fa' : '');
      for (const p of paras) { await fadeWords(p, lang, ''); await sleep(250); }
      print(lang === 'fa' ? `<span class="out-dim">— تمام. هر سؤالی داری بپرس.</span>` : `<span class="out-dim">— end. Ask me anything about it.</span>`, lang === 'fa' ? 'fa' : '');
    },
    aboutme() { if (window.DESKTOP) { window.DESKTOP.open('aboutme'); print(`<span class="out-green">✔</span> opened <span class="out-blue">About me</span>`); return; } print(`opening <span class="out-blue">about-me.html</span>…`, 'out-dim'); setTimeout(() => location.href = 'about-me.html', 350); },
    apps() {
      if (!window.DESKTOP) { print(`Apps live on the computer — type <span class="out-blue">/computer</span>`, 'out-dim'); return; }
      print(T('Apps on this computer:'), 'out-dim');
      window.DESKTOP.apps().forEach(([id, title]) => print(`  <span class="out-blue">${id.padEnd(12)}</span> ${title}`));
      print(`${T('Open one with')} <span class="out-yellow">/open lunamc</span>`, 'out-dim');
    },
    open(arg) {
      if (!window.DESKTOP) { print(`Apps live on the computer — type <span class="out-blue">/computer</span>`, 'out-dim'); return; }
      const id = (arg || '').toLowerCase().replace(/[^a-z]/g, '');
      if (!id) { print(`Usage: <span class="out-yellow">/open &lt;app&gt;</span> — see <span class="out-blue">/apps</span>`, 'out-dim'); return; }
      const alias = { youtube: 'social', socials: 'social', skin: 'skineditor', skineditor: 'skineditor', editor: 'skineditor', paint: 'skineditor', lookup: 'userlookup', skinlookup: 'skineditor', user: 'userlookup', hypixel: 'userlookup', calc: 'calculator', mc: 'minicraft', minecraft: 'minicraft', games: 'snake', tools: 'hyptools', hypixeltools: 'hyptools', prestige: 'prestige', ratio: 'ratio', fkdr: 'ratio', compare: 'compare', status: 'serverstatus', server: 'serverstatus', serverstatus: 'serverstatus', leaderboard: 'guildboard', guildboard: 'guildboard', cps: 'cpstest', cpstest: 'cpstest', notepad: 'notepad', notes: 'notepad' }[id] || id;
      if (window.DESKTOP.open(alias)) print(`<span class="out-green">✔</span> opened <span class="out-blue">${esc(alias)}</span>`);
      else print(`no app called <span class="out-red">${esc(id)}</span> — see <span class="out-blue">/apps</span>`);
    },
    async check(arg) {
      const who = (arg || '').trim().replace(/-/g, '');
      if (!/^([A-Za-z0-9_]{1,16}|[0-9a-fA-F]{32})$/.test(who)) { print(`${T('Usage:')} <span class="out-yellow">/check &lt;username or uuid&gt;</span> — ${T('is a Minecraft player blacklisted? (Seraph + Urchin)')}`, 'out-dim'); return; }
      const wait = print(`<span class="out-dim">${T('checking')} <span class="out-cyan">${esc(who)}</span>…</span>`);
      const get = async (url, opts, ms = 15000) => {
        const c = new AbortController(); const tm = setTimeout(() => c.abort(), ms);
        try { const r = await fetch(url, { ...opts, signal: c.signal }); let d = null; try { d = await r.json(); } catch (e) {} return { status: r.status, d }; }
        catch (e) { return { status: 0, d: null, timeout: e.name === 'AbortError' }; }
        finally { clearTimeout(tm); }
      };
      // 1) who is this? Mojang through the proxy: {success, ign, uuid}
      const who1 = await get(`${PROXY}/convert?player=${encodeURIComponent(who)}`);
      wait.remove();
      if (who1.status === 404) { print(`<span class="out-red">✘</span> ${T('Player not found:')} <span class="out-cyan">${esc(who)}</span>`); return; }
      if (!who1.d || !who1.d.success) { print(`<span class="out-red">✘</span> ${T('Could not resolve the player')} <span class="out-dim">(${who1.timeout ? 'timeout' : who1.status || 'network'})</span>`); return; }
      const { ign, uuid } = who1.d;
      print(`<span class="out-blue">${T('player')}</span>   <span class="out-cyan">${esc(ign)}</span>  <span class="out-dim">${uuid}</span>`);
      // 2) both blacklists at once
      const [se, ur] = await Promise.all([
        get(`https://api.seraph.si/${uuid}/blacklist`, { headers: { 'seraph-api-key': SERAPH_API_KEY } }),
        get(`${PROXY}/urchin?uuid=${uuid}`),
      ]);
      const line = (name, html) => print(`<span class="out-blue">${name.padEnd(8)}</span> ${html}`);
      const clean = s => String(s || '').replace(/\(\s*upgraded\s*\)/gi, '').replace(/^\s*legacy\s*-\s*/i, '').replace(/\s{2,}/g, ' ').trim();   // Seraph's migration markers, noise for the reader
      const title = s => String(s || 'tag').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());   // confirmed_cheater → Confirmed Cheater
      const why = s => { s = clean(s); if (s) print(`         <span class="out-dim">${esc(s)}</span>`); };
      const fail = (r, host) => `<span class="out-yellow">?</span> ${T('check failed')} <span class="out-dim">(${r.timeout ? host + ' timed out' : r.status === 429 ? 'rate limited' : (r.d && (r.d.cause || r.d.error)) || r.status || 'network'})</span>`;
      // Seraph: GET /{uuid}/blacklist → data.blacklist.tagged / report_type / reason
      if (se.status === 200 && se.d && se.d.success && se.d.data) {
        const bl = se.d.data.blacklist || {}, bot = se.d.data.bot || {};
        if (bl.tagged) { line('seraph', `<span class="out-red">⚠ ${T('BLACKLISTED')}</span> <span class="out-yellow">${esc(bl.report_type || 'Blacklist')}</span>${bl.verified ? ` <span class="out-green">${T('verified')}</span>` : ''}`); why(bl.reason || bl.tooltip); }
        else if (bot.tagged) { line('seraph', `<span class="out-yellow">🤖 ${T('bot account')}</span>`); why(bot.reason || bot.tooltip); }
        else line('seraph', `<span class="out-green">✔ ${T('not blacklisted')}</span>`);
      } else line('seraph', fail(se, 'api.seraph.si'));
      // Urchin: proxy /urchin → {success, tags:[{tag_type, reason}]}; an empty list is clean
      if (ur.d && ur.d.notConfigured) line('urchin', `<span class="out-yellow">?</span> ${T('not configured on this proxy')} <span class="out-dim">(URCHIN_KEY)</span>`);
      else if (ur.status === 200 && ur.d && ur.d.success && Array.isArray(ur.d.tags)) {
        const tags = ur.d.tags;
        if (!tags.length) line('urchin', `<span class="out-green">✔ ${T('not blacklisted')}</span>`);
        else {
          line('urchin', `<span class="out-red">⚠ ${T('BLACKLISTED')}</span> ${tags.map(x => `<span class="out-yellow">${esc(title(x.tag_type))}</span>`).join(' · ')}`);
          tags.forEach(x => { if (clean(x.reason)) print(`         <span class="out-dim">${esc(title(x.tag_type))}: ${esc(clean(x.reason))}</span>`); });
        }
      } else line('urchin', fail(ur, 'api.urchin.gg'));
      if (window.DESKTOP) print(`${T('Full profile:')} <span class="out-yellow">/open lookup</span>`, 'out-dim');
    },
    blacklist(arg) { return COMMANDS.check(arg); },
    // /user: the full User Lookup app on that player — a window on the computer, the page elsewhere
    user(arg) {
      const who = (arg || '').trim().replace(/-/g, '');
      if (!/^([A-Za-z0-9_]{1,16}|[0-9a-fA-F]{32})$/.test(who)) { print(`${T('Usage:')} <span class="out-yellow">/user &lt;username or uuid&gt;</span> — ${T('full profile: skin, Hypixel, guild, blacklists')}`, 'out-dim'); return; }
      if (window.DESKTOP) { window.DESKTOP.open('userlookup', null, 'u=' + encodeURIComponent(who)); print(`<span class="out-green">✔</span> ${T('opened')} <span class="out-blue">User Lookup</span> → <span class="out-cyan">${esc(who)}</span>`); return; }
      print(`${T('opening')} <span class="out-blue">User Lookup</span> → <span class="out-cyan">${esc(who)}</span>…`, 'out-dim');
      setTimeout(() => location.href = 'computer.html#userlookup?u=' + encodeURIComponent(who), 350);
    },
    lookup(arg) { return COMMANDS.user(arg); },
    compare(arg) {
      const [a, b] = (arg || '').trim().split(/[\s,]+|\s+vs\s+/i).filter(Boolean);
      const ok = x => /^[A-Za-z0-9_]{1,16}$/.test(x || '');
      if (!ok(a) || !ok(b)) { print(`${T('Usage:')} <span class="out-yellow">/compare &lt;player&gt; &lt;player&gt;</span> — ${T('two players side by side')}`, 'out-dim'); return; }
      openTool('compare', 'Compare Players', `a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`, `${a} vs ${b}`);
    },
    prestige(arg) { const who = (arg || '').trim(); openTool('prestige', 'Prestige Calculator', /^[A-Za-z0-9_]{1,16}$/.test(who) ? 'u=' + encodeURIComponent(who) : '', who); },
    ratio(arg) { const who = (arg || '').trim(); openTool('ratio', 'Ratio Calculator', /^[A-Za-z0-9_]{1,16}$/.test(who) ? 'u=' + encodeURIComponent(who) : '', who); },
    fkdr(arg) { return COMMANDS.ratio(arg); },
    status(arg) { const host = (arg || '').trim().toLowerCase(); openTool('serverstatus', 'Server Status', /^[a-z0-9.\-_:]{1,120}$/.test(host) ? 's=' + encodeURIComponent(host) : '', host); },
    leaderboard(arg) { const g = (arg || '').trim(); openTool('guildboard', 'Guild Leaderboard', g ? 'g=' + encodeURIComponent(g.slice(0, 32)) : '', g); },
    tools() { openTool('hyptools', 'Hypixel Tools', ''); },
    cps() { openTool('cpstest', 'CPS Test', ''); },
    notepad() { openTool('notepad', 'Notepad', ''); },
    socials() {
      const L = (t, u) => `<a class="out-blue" href="${u}" target="_blank" rel="noopener">→ ${t}</a>`;
      print(`youtube    ${L('youtube.com/@WaishChannel', 'https://www.youtube.com/@WaishChannel')}`);
      print(`aparat     ${L('aparat.com/waish', 'https://aparat.com/waish')}`);
      print(`instagram  ${L('instagram.com/asunawaish', 'https://instagram.com/asunawaish')}`);
      print(`telegram   ${L('t.me/wishingcommunity', 'https://t.me/wishingcommunity')}`);
      print(`discord    ${L('discord.gg/8HVsMqucZ2', 'https://discord.gg/8HVsMqucZ2')} <span class="out-dim">(10k+ members)</span>`);
      print(`lunamc     ${L('play.lunamc.ir', 'https://play.lunamc.ir')}`);
      print(`clutchping ${L('clutchping.com', 'https://clutchping.com')}`);
      print(`wbio       ${L('wbio.ir', 'https://wbio.ir')}`);
    },
    // the Discord server (live counts from Discord's public invite endpoint, which sends CORS headers) and the bot that lives there
    async discord() {
      const L = (t, u) => `<a class="out-blue" href="${u}" target="_blank" rel="noopener">→ ${t}</a>`;
      let counts = '';
      try {
        const c = new AbortController(); const tm = setTimeout(() => c.abort(), 6000);
        const r = await fetch('https://discord.com/api/v10/invites/8HVsMqucZ2?with_counts=true', { signal: c.signal }); clearTimeout(tm);
        const d = await r.json();
        if (d && d.guild) counts = ` <span class="out-dim">— <span class="out-green">${(d.approximate_presence_count || 0).toLocaleString()}</span> ${T('online')} · ${(d.approximate_member_count || 0).toLocaleString()} ${T('members')}</span>`;
      } catch (e) {}
      print(`<span class="out-cyan">Wishing</span>${counts}`);
      print(`${T('join')}       ${L('discord.gg/8HVsMqucZ2', 'https://discord.gg/8HVsMqucZ2')}`);
      print(`${T('bot')}        <span class="out-dim">${T('the same commands as here, as slash commands in Discord:')}</span>`);
      print(`           <span class="out-yellow">/check</span> <span class="out-yellow">/stats</span> <span class="out-yellow">/skin</span> <span class="out-yellow">/guild</span> <span class="out-yellow">/about</span> <span class="out-yellow">/projects</span> <span class="out-yellow">/lunamc</span> <span class="out-yellow">/socials</span> <span class="out-yellow">/site</span>`);
      print(`${T('add it to your server, or to your own account to use it anywhere:')} ${L('get the waish bot', 'https://discord.com/oauth2/authorize?client_id=1550598910240620574')}`, 'out-dim');
    },
    contact() {
      print(`Best way is to create a ticket in Discord — <a class="out-blue" href="https://discord.gg/8HVsMqucZ2" target="_blank" rel="noopener">discord.gg/8HVsMqucZ2</a> — but you can DM him on Instagram too: <a class="out-blue" href="https://instagram.com/asunawaish" target="_blank" rel="noopener">instagram.com/asunawaish</a>`);
      print(`all links: <span class="out-blue">/socials</span>`, 'out-dim');
    },
    clear() { body.innerHTML = ''; },
    computer() { print(`booting the computer…`, 'out-dim'); setTimeout(() => location.href = 'computer.html', 350); },
    terminal() { COMMANDS.computer(); },
    home() { print(`going home…`, 'out-dim'); setTimeout(() => location.href = 'index.html', 350); },
  };

  async function ask(question) {
    const thinking = print(`<span class="out-dim">…</span>`);
    await sleep(350);
    thinking.remove();
    const res = window.WAISH_LLM.answer(question);
    await fadeWords(res.text, res.lang, res.emoji);
  }

  let busy = false;
  async function run(raw) {
    const cmd = raw.trim(); if (!cmd || busy) return;
    busy = true;
    try {
      echo(cmd); history.unshift(cmd); hIdx = -1;
      if (cmd.startsWith('/')) {
        const [name, ...rest] = cmd.slice(1).split(/\s+/);
        const fn = COMMANDS[name.toLowerCase()];
        if (fn) await fn(rest.join(' '));
        else print(`command not found: <span class="out-red">/${esc(name)}</span> — try <span class="out-blue">/help</span>`);
      } else {
        await ask(cmd);
      }
    } finally { busy = false; }
  }

  input.addEventListener('keydown', async e => {
    if (e.key === 'Enter') { const v = input.value; input.value = ''; await run(v); }
    else if (e.key === 'ArrowUp') { if (hIdx < history.length - 1) { hIdx++; input.value = history[hIdx]; } e.preventDefault(); }
    else if (e.key === 'ArrowDown') { if (hIdx > 0) { hIdx--; input.value = history[hIdx]; } else { hIdx = -1; input.value = ''; } e.preventDefault(); }
  });

  return { print, run, COMMANDS };
};
