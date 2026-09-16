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

  const COMMANDS = {
    help() {
      print(`${T('Commands start with')} <span class="out-red">/</span>${T('. Anything else is a question for the assistant (English or فارسی).')}`, 'out-dim');
      const rows = [
        ['/about', 'who Waish is'],
        ['/projects', 'list his work'],
        ['/lunamc', 'the Minecraft server'],
        ['/ip', 'copy the LunaMC server IP'],
        ['/clutchping', 'the ping-reduction service'],
        ['/story', 'the full Waish story (/story fa for Persian)'],
        ['/setup', 'PC / stream setup'],
        ['/aboutme', 'open the About Me page (setup, packs, settings)'],
        ['/socials', 'where to find Waish'],
        ['/contact', 'how to reach him'],
        ['/clear', 'clear the screen'],
      ];
      if (mode === 'full') rows.push(['/open <app>', 'open an app window (see /apps)'], ['/apps', 'list the apps on this computer'], ['/home', 'back to the main site'], ['/bg <10-30>', 'set terminal wallpaper opacity']);
      else rows.push(['/computer', 'open the computer (desktop + full terminal)']);
      rows.forEach(([c, d]) => print(`  <span class="out-blue">${c.padEnd(14)}</span> ${T(d)}`));
      print(`\n${T('Example:')} <span class="out-yellow">what mouse do you use?</span>  ·  <span class="out-yellow">ستاپت چیه؟</span>  ·  <span class="out-yellow">how does tcp work</span>`, 'out-dim');
    },
    about() { print(`Waish — server admin, builder, content creator.`); print(`Runs LunaMC, builds ClutchPing, streams on Aparat & YouTube, and the infra behind all of it.`, 'out-dim'); },
    projects() {
      const list = window.PROJECTS || [
        { name: 'LunaMC', desc: 'Persian-language Minecraft server.' },
        { name: 'ClutchPing', desc: 'Ping reduction for gamers — clutchping.com' },
        { name: 'Content', desc: 'Streams & videos on Aparat and YouTube.' },
        { name: 'This terminal', desc: 'Offline assistant on a local knowledge base.' },
      ];
      list.forEach(p => print(`<span class="out-red">●</span> <span class="out-blue">${p.name}</span> <span class="out-dim">— ${p.desc}</span>`));
      print(window.DESKTOP ? `Open one: <span class="out-blue">/open lunamc</span> · <span class="out-blue">/open projects</span>` : `Full pages: <span class="out-blue">projects.html</span>`, 'out-dim');
    },
    lunamc() { print(`<span class="out-cyan">LunaMC</span> — Persian-language Minecraft server.`); print(`Bedwars, custom plugins, active community.`, 'out-dim'); print(`IP: <span class="out-cyan">Play.LunaMC.iR</span>  <span class="out-dim">(type /ip to copy)</span>`); },
    ip() { navigator.clipboard?.writeText('Play.LunaMC.iR'); print(`<span class="out-green">✔</span> copied <span class="out-cyan">Play.LunaMC.iR</span> to clipboard`); },
    clutchping() { print(`<span class="out-cyan">⚡ ClutchPing</span> — lower ping for gamers.`); print(`Relay-based network optimization. Started with LunaMC, expanding to every game.`, 'out-dim'); print(`<span class="out-blue">→ clutchping.com</span>`); },
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
      if (window.DESKTOP.open(id)) print(`<span class="out-green">✔</span> opened <span class="out-blue">${esc(id)}</span>`);
      else print(`no app called <span class="out-red">${esc(id)}</span> — see <span class="out-blue">/apps</span>`);
    },
    socials() {
      print(`aparat     <span class="out-blue">→ aparat.com/waish</span>`);
      print(`youtube    <span class="out-dim">→ (link coming soon)</span>`);
      print(`lunamc     <span class="out-blue">→ play.lunamc.ir</span>`);
      print(`clutchping <span class="out-blue">→ clutchping.com</span>`);
    },
    contact() { COMMANDS.socials(); print(`discord / email: <span class="out-dim">coming soon</span>`); },
    clear() { body.innerHTML = ''; },
    computer() { print(`booting the computer…`, 'out-dim'); setTimeout(() => location.href = 'computer.html', 350); },
    terminal() { COMMANDS.computer(); },
    home() { print(`going home…`, 'out-dim'); setTimeout(() => location.href = 'index.html', 350); },
    bg(arg) {
      const n = parseInt(arg, 10);
      if (isNaN(n) || n < 10 || n > 30) { print(`Usage: <span class="out-yellow">/bg 10</span> … <span class="out-yellow">/bg 30</span> (background opacity %)`, 'out-dim'); return; }
      document.documentElement.style.setProperty('--bg-opacity', n / 100);
      try { localStorage.setItem('waish-bg-opacity', n); } catch (e) {}
      print(`<span class="out-green">✔</span> terminal wallpaper opacity set to ${n}%`);
    },
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
