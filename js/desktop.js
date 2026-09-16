/* ============================================================
   COMPUTER — window manager for computer.html
   Apps live in APPS; DESKTOP.open('id') opens/focuses a window.
   ============================================================ */
window.DESKTOP = (function () {
  const ICONS = {
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    cart: '<svg viewBox="0 0 24 24"><path d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM3 2v2h2l3.6 7.6L7.2 14A2 2 0 0 0 9 17h11v-2H9.4l1-2h7.5a2 2 0 0 0 1.8-1.1L23 5H6.2L5.3 3H3z"/></svg>',
    grid: '<svg viewBox="0 0 24 24"><path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z"/></svg>',
    user: '<svg viewBox="0 0 24 24"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4 0-9 2-9 5v3h18v-3c0-3-5-5-9-5z"/></svg>',
    pc: '<svg viewBox="0 0 24 24"><path d="M3 4h18a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-7v2h3v2H7v-2h3v-2H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm1 2v9h16V6H4z"/></svg>',
  };

  /* ---------- app definitions ---------- */
  const APPS = {
    terminal:   { title: 'Terminal', tile: 'term', icon: '➜', kind: 'terminal', w: .66, h: .72 },
    projects:   { title: 'Projects', tile: 'projects', icon: ICONS.grid, kind: 'page', src: 'projects.html?embed=1', w: .78, h: .82 },
    youtube:    { title: 'YouTube', tile: 'youtube', icon: ICONS.play, kind: 'card', sub: 'youtube.com · Persian BedWars', w: .46, h: .5,
                  text: 'The Waish YouTube channel — Minecraft, mostly BedWars. Gameplay, PvP mechanics, ping & optimization, clients, and the occasional server-building video. Proper editing, thumbnails and structure.',
                  links: [['Open YouTube ↗', '#', true]], meta: 'link coming soon' },
    aparat:     { title: 'Aparat', tile: 'aparat', icon: '<img class="logo" src="assets/aparat-logo.png" alt="">', kind: 'card', sub: 'aparat.com/waish', w: .46, h: .5,
                  text: 'Streams and videos for the Persian-speaking community — BedWars gameplay, tutorials, and whatever Waish is building at the time.',
                  links: [['Open Aparat ↗', 'https://aparat.com/waish']], meta: 'external site' },
    lunamc:     { title: 'LunaMC', tile: 'lunamc', icon: '<img src="assets/luna-logo.png" alt="">', kind: 'page', src: 'projects/lunamc.html?embed=1', w: .74, h: .82 },
    clutchping: { title: 'ClutchPing', tile: 'clutchping', icon: '<img src="assets/clutchping-white.png" alt="">', kind: 'page', src: 'projects/clutchping.html?embed=1', w: .74, h: .82 },
    // nairo: drop the real logo at assets/nairo-logo.png — the cart shows until then
    nairo:      { title: 'NairoShop', tile: 'nairo', icon: '<img class="logo" src="assets/nairo-logo.png" alt="" onerror="this.remove()"><span class="fb">' + ICONS.cart + '</span>', kind: 'card', sub: 'digital products & services', w: .46, h: .52,
                  text: 'NairoShop started from a real problem: many Iranian users can\'t buy foreign digital services and products because of international payment restrictions. NairoShop gives access to the products and services that are hard to pay for directly from Iran.',
                  links: [['Open NairoShop ↗', '#', true]], meta: 'link coming soon' },
    aboutme:    { title: 'About me', tile: 'aboutme', icon: ICONS.user, kind: 'page', src: 'about-me.html?embed=1', w: .78, h: .82 },
    thispc:     { title: 'This PC', tile: 'thispc', icon: ICONS.pc, kind: 'explorer', w: .7, h: .68 },
  };
  const ORDER = ['terminal', 'projects', 'youtube', 'aparat', 'lunamc', 'clutchping', 'nairo', 'aboutme']; // desktop icons
  const PINNED = ['thispc'];                                                                             // taskbar

  /* ---------- This PC: drives + files (edit freely) ----------
     item types: img (opens the picture) · link (opens a site) · app / folder (just shown) · txt (shows a note) */
  const DRIVES = [
    { letter: 'C', name: 'Gallery', icon: '🖼️', used: .62, size: '256 GB', items: [
      { type: 'img', name: 'setup-desk.jpg', src: 'assets/pc/setup-desk.jpg' },
      { type: 'img', name: 'setup-wide.jpg', src: 'assets/pc/setup-wide.jpg' },
      { type: 'img', name: 'luna-banner.jpg', src: 'assets/luna-banner.jpg' },
      { type: 'img', name: 'luna-bg.jpg', src: 'assets/luna-bg.jpg' },
      { type: 'img', name: 'waish.jpg', src: 'assets/avatar.jpg' },
      { type: 'img', name: 'terminal-bg.jpg', src: 'assets/terminal-bg.jpg' },
    ] },
    { letter: 'D', name: 'Useful apps', icon: '🧰', used: .41, size: '512 GB', items: [
      { type: 'app', name: 'Cinema 4D', icon: '🎬', sub: '3D · ~6 years' },
      { type: 'app', name: 'Blender', icon: '🧊', sub: '3D' },
      { type: 'app', name: 'Python', icon: '🐍', sub: 'scripts' },
      { type: 'app', name: 'MySQL', icon: '🗄️', sub: 'databases' },
      { type: 'txt', name: 'readme.txt', icon: '📄', text: 'Apps Waish actually uses. Add or rename them in js/desktop.js → DRIVES → D:// Useful apps.' },
    ] },
    { letter: 'F', name: 'Editing', icon: '✂️', used: .77, size: '1 TB', items: [
      { type: 'folder', name: 'Cinema 4D projects', icon: '📁' },
      { type: 'folder', name: 'Blender scenes', icon: '📁' },
      { type: 'folder', name: 'Thumbnails', icon: '📁' },
      { type: 'folder', name: 'Renders', icon: '📁' },
      { type: 'txt', name: 'pipeline.txt', icon: '📄', text: 'idea & script → recording → editing → thumbnail → SEO → upload → analytics' },
    ] },
    { letter: 'H', name: 'Videos', icon: '🎥', used: .88, size: '2 TB', items: [
      { type: 'link', name: 'Aparat channel', icon: '<img src="assets/aparat-logo.png" alt="" style="width:60%;height:60%;object-fit:contain">', href: 'https://aparat.com/waish' },
      { type: 'app', name: 'YouTube', icon: '▶️', sub: 'link soon' },
      { type: 'folder', name: 'BedWars', icon: '📁' },
      { type: 'folder', name: 'Tutorials', icon: '📁' },
      { type: 'folder', name: 'Streams', icon: '📁' },
    ] },
  ];

  const T = window.I18N ? window.I18N.t : x => x;
  const $ = s => document.querySelector(s);
  const desk = $('.desktop'), layer = $('.windows'), tasks = $('.tasks');
  const wins = {}; let z = 10; let focused = null;
  const isMobile = () => matchMedia('(max-width: 760px)').matches;

  /* ---------- icons ---------- */
  const iconsEl = $('.icons');
  ORDER.forEach(id => {
    const a = APPS[id];
    const b = document.createElement('button'); b.className = 'icon'; b.type = 'button'; b.dataset.app = id;
    b.innerHTML = `<div class="tile ${a.tile}">${a.icon}</div><span>${a.title}</span>`;
    b.addEventListener('click', () => open(id, b));
    iconsEl.appendChild(b);
  });

  /* ---------- window animations ----------
     open / restore grow out of the icon or taskbar button that was clicked; minimize / close shrink back into it. */
  const EASE = 'cubic-bezier(.22,.61,.36,1)';
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const taskBtn = id => document.querySelector(`.taskbar .task[data-app="${id}"]`);
  function originFor(w, from) {
    if (!from || !from.getBoundingClientRect) return null;
    const r = w.getBoundingClientRect(), f = from.getBoundingClientRect(); if (!f.width || !r.width) return null;
    return { dx: (f.left + f.width / 2) - (r.left + r.width / 2), dy: (f.top + f.height / 2) - (r.top + r.height / 2) };
  }
  const shrunk = o => o ? { transform: `translate(${o.dx}px, ${o.dy}px) scale(.12)`, opacity: 0 } : { transform: 'scale(.96) translateY(10px)', opacity: 0 };
  function animIn(w, from) {
    if (reduce() || !w.animate) return;
    const o = originFor(w, from);
    w.animate([shrunk(o), { transform: 'none', opacity: 1 }], { duration: o ? 320 : 220, easing: EASE });
  }
  function animOut(w, to, done) {
    if (reduce() || !w.animate) return done();
    const o = originFor(w, to);
    const a = w.animate([{ transform: 'none', opacity: 1 }, shrunk(o)], { duration: o ? 260 : 160, easing: 'cubic-bezier(.4,0,.7,.3)', fill: 'forwards' });
    a.onfinish = () => { done(); a.cancel(); };
  }

  /* ---------- windows ---------- */
  function open(id, from) {
    const a = APPS[id]; if (!a) return false;
    if (wins[id]) { restore(id, from); return true; }
    const w = document.createElement('div'); w.className = 'win ' + (a.kind === 'terminal' ? 'terminal' : ''); w.dataset.app = id;
    w.innerHTML = `<div class="win-chrome">
        <span class="dot r" title="close"></span><span class="dot y" title="minimize"></span><span class="dot g" title="maximize"></span>
        <span class="win-title">${a.kind === 'terminal' ? 'waish@computer: ~' : a.title}</span>
      </div><div class="win-body"></div>`;
    const body = w.querySelector('.win-body');
    if (a.kind === 'terminal') body.appendChild($('#terminalTemplate').content.cloneNode(true));
    else if (a.kind === 'page') body.innerHTML = `<iframe src="${a.src}" title="${a.title}" loading="lazy"></iframe>`;
    else if (a.kind === 'explorer') explorer(body);
    else body.innerHTML = `<div class="app-card">
        <div class="head"><div class="tile ${a.tile}">${a.icon}</div><div><h2>${a.title}</h2><div class="sub">${a.sub || ''}</div></div></div>
        <p>${a.text}</p>
        <div class="actions">${a.links.map(([t, h, dis]) => `<a class="btn btn-primary${dis ? ' disabled' : ''}" href="${h}" target="_blank" rel="noopener">${t}</a>`).join('')}</div>
        <div class="meta">// ${a.meta || ''}</div></div>`;

    // size + position (cascade a little for each new window)
    const R = layer.getBoundingClientRect(); const n = Object.keys(wins).length;
    const W = Math.min(R.width - 40, Math.max(420, R.width * a.w)), H = Math.min(R.height - 30, Math.max(260, R.height * a.h));
    const x = Math.max(120, (R.width - W) / 2 + n * 24), y = Math.max(10, (R.height - H) / 2 + n * 18);
    Object.assign(w.style, { width: W + 'px', height: H + 'px', left: Math.min(x, R.width - W - 10) + 'px', top: Math.min(y, R.height - H - 10) + 'px' });

    // chrome buttons
    w.querySelector('.dot.r').addEventListener('click', e => { e.stopPropagation(); close(id); });
    w.querySelector('.dot.y').addEventListener('click', e => { e.stopPropagation(); minimize(id); });
    w.querySelector('.dot.g').addEventListener('click', e => { e.stopPropagation(); setMax(w, !w.classList.contains('max')); });
    w.querySelector('.win-chrome').addEventListener('dblclick', e => { if (!e.target.classList.contains('dot')) setMax(w, !w.classList.contains('max')); });
    w.addEventListener('pointerdown', () => focus(id));
    drag(w, w.querySelector('.win-chrome'));
    resizable(w);

    layer.appendChild(w); wins[id] = w;
    if (a.kind === 'terminal' && typeof window.bootTerminal === 'function') window.bootTerminal(w);
    addTask(id); focus(id); animIn(w, from);
    return true;
  }
  function focus(id) {
    const w = wins[id]; if (!w) return;
    Object.values(wins).forEach(x => x.classList.remove('focus'));
    w.classList.add('focus'); w.style.zIndex = ++z; focused = id;
    if (APPS[id].kind === 'terminal') { const i = w.querySelector('#cmdInput'); if (i && !isMobile()) i.focus(); }
    renderTasks();
  }
  function minimize(id) {
    const w = wins[id]; if (!w || w.classList.contains('min') || w._busy) return;
    w._busy = true; if (focused === id) focused = null;
    animOut(w, taskBtn(id), () => { w.classList.add('min'); w._busy = false; renderTasks(); });
    renderTasks();
  }
  function restore(id, from) {
    const w = wins[id]; if (!w) return;
    const wasMin = w.classList.contains('min');
    w.classList.remove('min');
    if (wasMin) animIn(w, from || taskBtn(id));   // before focus(): renderTasks() rebuilds the taskbar buttons
    focus(id);
  }
  function close(id) {
    const w = wins[id]; if (!w || w._busy) return;
    w._busy = true; if (focused === id) focused = null;
    animOut(w, w.classList.contains('min') ? null : taskBtn(id), () => { w.remove(); delete wins[id]; renderTasks(); });
  }
  function toggle(id, from) { const w = wins[id]; if (!w) return open(id, from); if (w.classList.contains('min') || focused !== id) restore(id, from); else minimize(id); }

  /* ---------- maximize (fullscreen inside the desktop) ----------
     geometry is set in JS so it can transition; .max only styles the frame. The previous size is kept in w._rest. */
  function geo(w, g, animate = true) {
    if (animate && !reduce()) { w.classList.add('snap'); clearTimeout(w._snapT); w._snapT = setTimeout(() => w.classList.remove('snap'), 340); }
    else w.classList.remove('snap');
    Object.assign(w.style, { left: g.left + 'px', top: g.top + 'px', width: g.width + 'px', height: g.height + 'px' });
  }
  function fullGeo() { const R = layer.getBoundingClientRect(); return { left: 0, top: 0, width: R.width, height: R.height }; }
  function setMax(w, on) {
    if (isMobile()) return;
    if (on && !w.classList.contains('max')) {
      w._rest = { left: w.offsetLeft, top: w.offsetTop, width: w.offsetWidth, height: w.offsetHeight };
      w.classList.add('max'); geo(w, fullGeo());
    } else if (!on && w.classList.contains('max')) {
      w.classList.remove('max'); geo(w, w._rest || { left: 40, top: 30, width: 640, height: 440 });
    }
  }
  addEventListener('resize', () => Object.values(wins).forEach(w => { if (w.classList.contains('max') && !isMobile()) geo(w, fullGeo(), false); }));

  /* ---------- dragging ----------
     drag a window to the top edge → it goes fullscreen; drag a fullscreen window down → it drops back to its old size. */
  const snapHint = document.createElement('div'); snapHint.className = 'snap-hint'; layer.appendChild(snapHint);
  const SNAP_Y = 8;
  function drag(w, handle) {
    let sx, sy, ox, oy, gx, gy, moving = false, armed = false, snap = false;
    handle.addEventListener('pointerdown', e => {
      if (isMobile() || e.target.classList.contains('dot')) return;
      const r = w.getBoundingClientRect();
      moving = true; armed = false; snap = false; sx = e.clientX; sy = e.clientY; ox = w.offsetLeft; oy = w.offsetTop;
      gx = (e.clientX - r.left) / r.width; gy = e.clientY - r.top;   // grab point: fraction along the bar, px down from the top
      w.classList.add('dragging'); desk.classList.add('wm-busy'); try { handle.setPointerCapture(e.pointerId); } catch (_) {}
    });
    handle.addEventListener('pointermove', e => {
      if (!moving) return;
      const R = layer.getBoundingClientRect();
      if (w.classList.contains('max')) {
        if (Math.hypot(e.clientX - sx, e.clientY - sy) < 14) return;   // small wiggle: stay fullscreen
        // leave fullscreen and put the old-size window under the pointer, at the same grab point
        const rest = w._rest || { width: Math.round(R.width * .66), height: Math.round(R.height * .72) };
        w.classList.remove('max', 'snap');
        Object.assign(w.style, { width: rest.width + 'px', height: rest.height + 'px' });
        ox = e.clientX - R.left - rest.width * gx; oy = e.clientY - R.top - gy; sx = e.clientX; sy = e.clientY;
        w.style.left = ox + 'px'; w.style.top = oy + 'px';
        return;
      }
      const x = Math.min(Math.max(ox + e.clientX - sx, -w.offsetWidth + 80), R.width - 80);
      const y = Math.min(Math.max(oy + e.clientY - sy, 0), R.height - 40);
      w.style.left = x + 'px'; w.style.top = y + 'px';
      const py = e.clientY - R.top;
      if (py > 24) armed = true;                          // must have been away from the edge once, so a pull-down doesn't re-snap
      snap = armed && py <= SNAP_Y;
      snapHint.classList.toggle('on', snap);
    });
    const stop = () => {
      if (!moving) return;
      moving = false; w.classList.remove('dragging'); desk.classList.remove('wm-busy'); snapHint.classList.remove('on');
      if (snap) { snap = false; setMax(w, true); }
    };
    handle.addEventListener('pointerup', stop); handle.addEventListener('pointercancel', stop);
  }

  /* ---------- resizing (right edge, bottom edge, corner) ---------- */
  function resizable(w) {
    ['e', 's', 'se'].forEach(dir => {
      const h = document.createElement('div'); h.className = 'win-rs ' + dir; w.appendChild(h);
      let sx, sy, sw, sh, on = false;
      h.addEventListener('pointerdown', e => {
        if (isMobile() || w.classList.contains('max')) return;
        on = true; sx = e.clientX; sy = e.clientY; sw = w.offsetWidth; sh = w.offsetHeight;
        w.classList.add('resizing'); desk.classList.add('wm-busy'); try { h.setPointerCapture(e.pointerId); } catch (_) {}
        e.stopPropagation();
      });
      h.addEventListener('pointermove', e => {
        if (!on) return;
        const R = layer.getBoundingClientRect();
        if (dir !== 's') w.style.width = Math.max(320, Math.min(sw + e.clientX - sx, R.width - w.offsetLeft)) + 'px';
        if (dir !== 'e') w.style.height = Math.max(200, Math.min(sh + e.clientY - sy, R.height - w.offsetTop)) + 'px';
      });
      const stop = () => { on = false; w.classList.remove('resizing'); desk.classList.remove('wm-busy'); };
      h.addEventListener('pointerup', stop); h.addEventListener('pointercancel', stop);
    });
  }

  /* ---------- This PC ---------- */
  function explorer(body) {
    body.innerHTML = `<div class="explorer"><div class="ex-side"><div class="ex-head">drives</div></div><div class="ex-main"></div></div>`;
    const side = body.querySelector('.ex-side'), main = body.querySelector('.ex-main');
    const bar = d => `<div class="bar"><i style="width:${Math.round(d.used * 100)}%"></i></div>`;
    DRIVES.forEach(d => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'ex-drive'; b.dataset.letter = d.letter;
      b.innerHTML = `<span class="d-ico">${d.icon}</span><span class="d-txt"><span class="d-name">${d.name}</span><span class="d-letter">${d.letter}://</span>${bar(d)}</span>`;
      b.addEventListener('click', () => show(d)); side.appendChild(b);
    });
    function home() {
      side.querySelectorAll('.ex-drive').forEach(x => x.classList.remove('on'));
      main.innerHTML = `<div class="ex-crumb"><b>This PC</b></div><div class="ex-drives">${DRIVES.map(d => `
        <button type="button" class="ex-dcard" data-letter="${d.letter}"><span class="d-ico">${d.icon}</span><span class="d-txt"><span class="d-name">${d.name}</span> <span class="d-letter">${d.letter}://</span>${bar(d)}<span class="d-free">${Math.round((1 - d.used) * 100)}${T('% free of')} ${d.size}</span></span></button>`).join('')}</div>`;
      main.querySelectorAll('.ex-dcard').forEach(c => c.addEventListener('click', () => show(DRIVES.find(d => d.letter === c.dataset.letter))));
    }
    function show(d) {
      side.querySelectorAll('.ex-drive').forEach(x => x.classList.toggle('on', x.dataset.letter === d.letter));
      main.innerHTML = `<div class="ex-crumb"><button type="button" class="home">This PC</button> › <b>${d.letter}://${d.name}</b> <span>· ${d.items.length} ${T('items')}</span></div><div class="ex-grid"></div><div class="ex-note" hidden></div>`;
      main.querySelector('.home').addEventListener('click', home);
      const grid = main.querySelector('.ex-grid'), note = main.querySelector('.ex-note');
      d.items.forEach(it => {
        const el = document.createElement(it.type === 'img' || it.type === 'link' ? 'a' : 'button');
        el.className = 'ex-item';
        if (it.type === 'img') { el.href = it.src; el.target = '_blank'; el.rel = 'noopener'; }
        else if (it.type === 'link') { el.href = it.href; el.target = '_blank'; el.rel = 'noopener'; }
        else el.type = 'button';
        el.innerHTML = `<span class="f-ico">${it.type === 'img' ? `<img src="${it.src}" alt="" loading="lazy">` : it.icon}</span><span class="f-name">${it.name}</span>${it.sub ? `<span class="f-sub">${it.sub}</span>` : ''}`;
        if (it.type === 'txt') el.addEventListener('click', () => { note.textContent = it.text; note.hidden = false; });
        grid.appendChild(el);
      });
    }
    home();
  }

  /* ---------- taskbar ---------- */
  const pinnedEl = $('.pinned');
  if (pinnedEl) PINNED.forEach(id => { const a = APPS[id]; const b = document.createElement('button'); b.type = 'button'; b.className = 'task'; b.dataset.app = id; b.title = a.title; b.innerHTML = `<span class="mini tile ${a.tile}">${a.icon}</span>${a.title}`; b.addEventListener('click', () => toggle(id, b)); pinnedEl.appendChild(b); });
  function addTask() { renderTasks(); }
  function renderTasks() {
    // pinned buttons double as the running indicator (lit when open, dim when minimized)
    if (pinnedEl) pinnedEl.querySelectorAll('.task').forEach((b, i) => { const id = PINNED[i], w = wins[id]; b.classList.toggle('on', !!w && focused === id); b.classList.toggle('min', !!w && w.classList.contains('min')); b.classList.toggle('open', !!w); });
    tasks.innerHTML = '';
    Object.keys(wins).filter(id => !PINNED.includes(id)).forEach(id => {
      const a = APPS[id], w = wins[id];
      const b = document.createElement('button'); b.type = 'button'; b.dataset.app = id;
      b.className = 'task' + (focused === id ? ' on' : '') + (w.classList.contains('min') ? ' min' : '');
      b.innerHTML = `<span class="mini tile ${a.tile}">${a.icon}</span>${a.title}`;
      b.addEventListener('click', () => toggle(id, b));
      tasks.appendChild(b);
    });
  }
  /* ---------- clock: Iran time (Asia/Tehran, UTC+3:30) with the Iranian (Jalali) and Gregorian dates ---------- */
  (function clock() {
    const el = $('.clock'); if (!el) return;
    el.setAttribute('data-i18n-skip', '');
    const fa = document.documentElement.classList.contains('fa');
    const fmt = (loc, o) => { try { return new Intl.DateTimeFormat(loc, Object.assign({ timeZone: 'Asia/Tehran' }, o)); } catch (e) { return null; } };
    const time = fmt('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    const jal  = fmt(fa ? 'fa-IR-u-ca-persian' : 'en-GB-u-ca-persian', { weekday: 'short', day: 'numeric', month: 'long' });
    const jalY = fmt(fa ? 'fa-IR-u-ca-persian' : 'en-GB-u-ca-persian', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const greg = fmt(fa ? 'fa-IR-u-ca-gregory' : 'en-GB', { day: 'numeric', month: 'short' });
    const gregY = fmt(fa ? 'fa-IR-u-ca-gregory' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const tick = () => {
      const d = new Date();
      const t = time ? time.format(d) : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const j = jal ? jal.format(d).replace(/ AP$/, '') : '', g = greg ? greg.format(d) : d.toLocaleDateString();
      el.innerHTML = `${t}<span class="tz">${fa ? 'تهران' : 'IRST'}</span><small>${j ? `<span class="jal">${j}</span> · ` : ''}${g}</small>`;
      el.title = (fa ? 'ساعت ایران (UTC+3:30)' : 'Iran Standard Time (UTC+3:30)') + (jalY ? '\n' + jalY.format(d).replace(/ AP$/, '') : '') + (gregY ? '\n' + gregY.format(d) : '');
    };
    tick(); setInterval(tick, 5000);
  })();

  /* ---------- start menu ---------- */
  const startBtn = $('.start'), menu = $('.start-menu');
  if (startBtn && menu) {
    ORDER.concat(PINNED).forEach(id => { const a = APPS[id]; const b = document.createElement('button'); b.type = 'button'; b.innerHTML = `<span class="sm-ico tile ${a.tile}">${a.icon}</span>${a.title}`; b.addEventListener('click', () => { open(id); menu.hidden = true; startBtn.classList.remove('on'); }); menu.querySelector('.sm-apps').appendChild(b); });
    startBtn.addEventListener('click', e => { e.stopPropagation(); menu.hidden = !menu.hidden; startBtn.classList.toggle('on', !menu.hidden); });
    document.addEventListener('pointerdown', e => { if (!menu.hidden && !menu.contains(e.target) && e.target !== startBtn) { menu.hidden = true; startBtn.classList.remove('on'); } });
  }

  // clicking the empty desktop unfocuses
  desk.addEventListener('pointerdown', e => { if (e.target === desk || e.target.classList.contains('wallpaper')) { Object.values(wins).forEach(x => x.classList.remove('focus')); focused = null; renderTasks(); } });

  return { open, close, minimize, restore, focus, toggle, apps: () => ORDER.concat(PINNED).map(id => [id, APPS[id].title]) };
})();
