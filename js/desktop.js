/* ============================================================
   COMPUTER — window manager for computer.html
   Apps live in APPS; DESKTOP.open('id') opens/focuses a window.
   ============================================================ */
window.DESKTOP = (function () {
  const ICONS = {
    hypixel: '<svg viewBox="0 0 24 24"><path d="M12 1.2 21.4 6.6v10.8L12 22.8 2.6 17.4V6.6z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M8 7h2.5v3.6h3V7H16v10h-2.5v-4.1h-3V17H8z"/></svg>',
    // brand marks for the Social card buttons (24×24 paths, filled with currentColor)
    youtube: '<svg viewBox="0 0 24 24"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg>',
    aparat: '<svg viewBox="0 0 24 24"><path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm-3.9 4.8a2.4 2.4 0 1 1-1.2 4.6 2.4 2.4 0 0 1 1.2-4.6zm10.5 3.4a2.4 2.4 0 1 1-4.6-1.2 2.4 2.4 0 0 1 4.6 1.2zM12 10.4a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2zm-6.6 5.4a2.4 2.4 0 1 1 4.6 1.2 2.4 2.4 0 0 1-4.6-1.2zm10.5 3.4a2.4 2.4 0 1 1 1.2-4.6 2.4 2.4 0 0 1-1.2 4.6z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24"><path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2-.1-1.3-.1-1.6-.1-4.8s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4 1.3-.1 1.6-.1 4.8-.1zM12 0C8.7 0 8.3 0 7.1.1 5.8.1 4.9.3 4.1.6c-.8.3-1.5.7-2.1 1.4C1.3 2.6.9 3.3.6 4.1.3 4.9.1 5.8.1 7.1 0 8.3 0 8.7 0 12s0 3.7.1 4.9c.1 1.3.3 2.2.6 2.9.3.8.7 1.5 1.4 2.1.6.7 1.3 1.1 2.1 1.4.8.3 1.6.5 2.9.6C8.3 24 8.7 24 12 24s3.7 0 4.9-.1c1.3-.1 2.2-.3 2.9-.6.8-.3 1.5-.7 2.1-1.4.7-.6 1.1-1.3 1.4-2.1.3-.8.5-1.6.6-2.9.1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9c-.1-1.3-.3-2.2-.6-2.9-.3-.8-.7-1.5-1.4-2.1C21.4 1.3 20.7.9 19.9.6 19.1.3 18.2.1 16.9.1 15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-10.8a1.4 1.4 0 1 0 0 2.9 1.4 1.4 0 0 0 0-2.9z"/></svg>',
    telegram: '<svg viewBox="0 0 24 24"><path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm5.6 8.2-2 9.3c-.1.7-.5.8-1.1.5l-3-2.2-1.5 1.4c-.2.2-.3.3-.6.3l.2-3.1 5.6-5.1c.2-.2 0-.3-.4-.1l-6.9 4.4-3-.9c-.6-.2-.7-.6.1-.9l11.7-4.5c.5-.2 1 .1.9.9z"/></svg>',
    discord: '<svg viewBox="0 0 24 24"><path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.6 1.3a18.3 18.3 0 0 0-5.5 0L8.6 3a19.7 19.7 0 0 0-4.9 1.5C.6 9.1-.3 13.6.1 18.1a19.9 19.9 0 0 0 6 3l1.3-2.1c-.7-.3-1.4-.6-2-1l.5-.4a14.2 14.2 0 0 0 12.2 0l.5.4c-.6.4-1.3.7-2 1l1.3 2.1a19.8 19.8 0 0 0 6-3c.5-5.2-.9-9.7-3.6-13.7zM8 15.3c-1.2 0-2.2-1.1-2.2-2.4S6.8 10.5 8 10.5s2.2 1.1 2.2 2.4-1 2.4-2.2 2.4zm8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4z"/></svg>',
    share: '<svg viewBox="0 0 24 24"><path d="M18 16a3 3 0 0 0-2.4 1.2l-7-4.1a3 3 0 0 0 0-2.2l7-4.1A3 3 0 1 0 15 5c0 .3 0 .6.1.9l-7 4.1a3 3 0 1 0 0 4l7 4.1c0 .3-.1.6-.1.9a3 3 0 1 0 3-3z"/></svg>',
    cart: '<svg viewBox="0 0 24 24"><path d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM3 2v2h2l3.6 7.6L7.2 14A2 2 0 0 0 9 17h11v-2H9.4l1-2h7.5a2 2 0 0 0 1.8-1.1L23 5H6.2L5.3 3H3z"/></svg>',
    grid: '<svg viewBox="0 0 24 24"><path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z"/></svg>',
    user: '<svg viewBox="0 0 24 24"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4 0-9 2-9 5v3h18v-3c0-3-5-5-9-5z"/></svg>',
    pc: '<svg viewBox="0 0 24 24"><path d="M3 4h18a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-7v2h3v2H7v-2h3v-2H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm1 2v9h16V6H4z"/></svg>',
  };

  /* ---------- app definitions ---------- */
  const APPS = {
    terminal:   { title: 'Terminal', tile: 'term', icon: '➜', kind: 'terminal', w: .66, h: .72 },
    projects:   { title: 'All projects', tile: 'projects', icon: ICONS.grid, kind: 'page', src: 'projects.html?embed=1', w: .78, h: .82 },
    // desktop folders: open one → pick an app inside
    projectsFolder: { title: 'Projects', tile: 'folder', icon: '📁', kind: 'folder', items: ['lunamc', 'clutchping', 'projects'], w: .46, h: .46, minW: 420 },
    gamesFolder: { title: 'Games', tile: 'folder', icon: '📁', kind: 'folder', items: ['snake', 'tetris', 'minicraft'], w: .46, h: .46, minW: 420 },
    social:     { title: 'Social', tile: 'youtube', icon: ICONS.share, kind: 'card', sub: 'youtube · aparat · instagram · telegram · discord', w: .46, h: .52,
                  text: 'The Waish YouTube channel — Minecraft, mostly BedWars. Gameplay, PvP mechanics, ping & optimization, clients, and the occasional server-building video. Proper editing, thumbnails and structure. Persian streams and videos live on Aparat.',
                  links: [['Open YouTube ↗', 'https://www.youtube.com/@WaishChannel', 0, 'youtube'], ['Aparat ↗', 'https://aparat.com/waish', 0, 'aparat'], ['Instagram ↗', 'https://instagram.com/asunawaish', 0, 'instagram'], ['Telegram ↗', 'https://t.me/wishingcommunity', 0, 'telegram'], ['Discord ↗', 'https://discord.gg/8HVsMqucZ2', 0, 'discord']], meta: 'youtube.com/@WaishChannel · 100+ videos' },
    lunamc:     { title: 'LunaMC', tile: 'lunamc', icon: '<img src="assets/luna-logo.png" alt="">', kind: 'page', src: 'projects/lunamc.html?embed=1', w: .74, h: .82 },
    clutchping: { title: 'ClutchPing', tile: 'clutchping', icon: '<img src="assets/clutchping-white.png" alt="">', kind: 'page', src: 'projects/clutchping.html?embed=1', w: .74, h: .82 },
    aboutme:    { title: 'About me', tile: 'aboutme', icon: ICONS.user, kind: 'page', src: 'about-me.html?embed=1', w: .78, h: .82 },
    thispc:     { title: 'This PC', tile: 'thispc', icon: ICONS.pc, kind: 'explorer', w: .7, h: .68 },
    bin:        { title: 'Recycle Bin', tile: 'bin', icon: '🗑️', kind: 'bin', w: .46, h: .5, minW: 420 },
    music:      { title: 'Music', tile: 'music', icon: '🎵', kind: 'page', src: 'apps/music.html?v=20260917i', w: .4, h: .8, minW: 400 },
    // games + small apps: each one is a standalone page in apps/ shown inside a window
    snake:      { title: 'Snake', tile: 'snake', icon: '🐍', kind: 'page', src: 'apps/snake.html?v=20260916b', w: .38, h: .78, minW: 380 },
    tetris:     { title: 'Tetris', tile: 'tetris', icon: '🧱', kind: 'page', src: 'apps/tetris.html?v=20260916b', w: .36, h: .84, minW: 380 },
    minicraft:  { title: 'Mini Minecraft', tile: 'minicraft', icon: '⛏️', kind: 'page', src: 'apps/minicraft.html?v=20260916b', w: .72, h: .8 },
    calculator: { title: 'Calculator', tile: 'calc', icon: '🧮', kind: 'page', src: 'apps/calculator.html?v=20260916b', w: .26, h: .74, minW: 340 },
    calendar:   { title: 'Calendar', tile: 'calendar', icon: '📅', kind: 'page', src: 'apps/calendar.html?v=20260916b', w: .44, h: .74, minW: 420 },
    userlookup: { title: 'User Lookup', tile: 'skin', icon: '🔍', kind: 'page', src: 'apps/lookup.html?v=20260919b', w: .58, h: .88, minW: 520 },
    // Hypixel Tools folder (apps/*.html, all sharing apps/tools.js)
    hyptools:   { title: 'Hypixel Tools', tile: 'hyp', icon: ICONS.hypixel, kind: 'folder', items: ['prestige', 'ratio', 'compare', 'serverstatus', 'guildboard'], w: .5, h: .5, minW: 440 },
    prestige:   { title: 'Prestige Calculator', tile: 'prestige', icon: '✫', kind: 'page', src: 'apps/prestige-calc.html?v=20260919a', w: .54, h: .86, minW: 470 },
    ratio:      { title: 'Ratio Calculator', tile: 'ratio', icon: '÷', kind: 'page', src: 'apps/ratio-calc.html?v=20260919a', w: .62, h: .86, minW: 480 },
    compare:    { title: 'Compare Players', tile: 'compare', icon: '⚔️', kind: 'page', src: 'apps/compare.html?v=20260919a', w: .58, h: .88, minW: 500 },
    serverstatus: { title: 'Server Status', tile: 'status', icon: '📡', kind: 'page', src: 'apps/server-status.html?v=20260919a', w: .5, h: .84, minW: 440 },
    guildboard: { title: 'Guild Leaderboard', tile: 'guildboard', icon: '🏆', kind: 'page', src: 'apps/guild-leaderboard.html?v=20260919a', w: .52, h: .88, minW: 460 },
    cpstest:    { title: 'CPS Test', tile: 'cps', icon: '🖱️', kind: 'page', src: 'apps/cps-test.html?v=20260919a', w: .42, h: .74, minW: 380 },
    notepad:    { title: 'Notepad', tile: 'notepad', icon: '📝', kind: 'page', src: 'apps/notepad.html?v=20260919a', w: .58, h: .78, minW: 460 },
    skineditor: { title: 'Skin Editor', tile: 'skined', icon: '🎨', kind: 'page', src: 'apps/skin-editor.html?v=20260917d', w: .72, h: .88, minW: 560 },
  };
  const ORDER = ['thispc', 'bin', 'terminal', 'projectsFolder', 'gamesFolder', 'hyptools', 'social', 'aboutme', 'music', 'calculator', 'calendar', 'userlookup', 'skineditor', 'cpstest', 'notepad']; // desktop icons, top-left down
  const PINNED = ['thispc'];                                                                             // taskbar
  // every launchable app, for the start menu and the terminal's /apps (folder contents included, no duplicates)
  const ALL = [...new Set(ORDER.flatMap(id => APPS[id].kind === 'folder' ? [id, ...APPS[id].items] : [id]).concat(PINNED))];

  /* ---------- This PC: drives + files (edit freely) ----------
     item types: img (opens the picture) · link (opens a site) · app / folder (just shown) · txt (shows a note) */
  const DRIVES = [
    { letter: 'C', name: 'Gallery', icon: '🖼️', used: .62, size: '256 GB', items: [
      { type: 'img', name: 'setup-desk.jpg', src: 'assets/pc/setup-desk.jpg' },
      { type: 'img', name: 'setup-wide.jpg', src: 'assets/pc/setup-wide.jpg' },
      { type: 'img', name: 'luna-banner.jpg', src: 'assets/luna-banner.jpg' },
      { type: 'img', name: 'luna-bg.jpg', src: 'assets/luna-bg.jpg?v=20260916c' },
      { type: 'img', name: 'waish.jpg', src: 'assets/avatar.jpg' },
      { type: 'img', name: 'terminal-bg.jpg', src: 'assets/terminal-bg.jpg' },
    ] },
    { letter: 'D', name: 'Useful apps', icon: '🧰', used: .41, size: '512 GB', items: [
      { type: 'run', name: 'Calculator', icon: '🧮', app: 'calculator' },
      { type: 'run', name: 'Calendar', icon: '📅', sub: 'Persian · Gregorian', app: 'calendar' },
      { type: 'run', name: 'User Lookup', icon: '🔍', sub: 'Minecraft · Hypixel · Seraph · Urchin', app: 'userlookup' },
      { type: 'run', name: 'Skin Editor', icon: '🎨', sub: 'paint & preview skins', app: 'skineditor' },
      { type: 'run', name: 'Music', icon: '🎵', sub: 'mp3 player', app: 'music' },
      { type: 'run', name: 'Notepad', icon: '📝', sub: 'notes, saved in your browser', app: 'notepad' },
      { type: 'run', name: 'CPS Test', icon: '🖱️', sub: 'clicks per second', app: 'cpstest' },
      { type: 'run', name: 'Prestige Calculator', icon: '✫', sub: 'BedWars stars & XP', app: 'prestige' },
      { type: 'run', name: 'Ratio Calculator', icon: '÷', sub: 'FKDR · WLR · BBLR · KDR', app: 'ratio' },
      { type: 'run', name: 'Compare Players', icon: '⚔️', sub: 'two players side by side', app: 'compare' },
      { type: 'run', name: 'Server Status', icon: '📡', sub: 'any Minecraft server', app: 'serverstatus' },
      { type: 'run', name: 'Guild Leaderboard', icon: '🏆', sub: 'weekly XP ranking', app: 'guildboard' },
      { type: 'app', name: 'Cinema 4D', icon: '🎬', sub: '3D · ~6 years' },
      { type: 'app', name: 'Blender', icon: '🧊', sub: '3D' },
      { type: 'app', name: 'Python', icon: '🐍', sub: 'scripts' },
      { type: 'app', name: 'MySQL', icon: '🗄️', sub: 'databases' },
      { type: 'txt', name: 'readme.txt', icon: '📄', text: 'Apps Waish actually uses. Add or rename them in js/desktop.js → DRIVES → D:// Useful apps.' },
    ] },
    { letter: 'G', name: 'Games', icon: '🎮', used: .33, size: '1 TB', items: [
      { type: 'run', name: 'Snake', icon: '🐍', app: 'snake' },
      { type: 'run', name: 'Tetris', icon: '🧱', app: 'tetris' },
      { type: 'run', name: 'Mini Minecraft', icon: '⛏️', sub: 'build & mine', app: 'minicraft' },
      { type: 'txt', name: 'readme.txt', icon: '📄', text: 'Small games made for this computer. Scores and worlds are saved in your browser.' },
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
      { type: 'link', name: 'YouTube channel', icon: '▶️', href: 'https://www.youtube.com/@WaishChannel' },
      { type: 'link', name: 'Discord server', icon: '💬', sub: '10k+ members', href: 'https://discord.gg/8HVsMqucZ2' },
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

  /* ---------- desktop icons ----------
     Laid out on a grid (columns, top-left down; top-right in Persian). Every icon can be dragged to another cell,
     or dropped on the Recycle Bin. Nothing is saved: a refresh puts everything back. On phones it's a plain grid. */
  const iconsEl = $('.icons');
  const CELL = { w: 66, h: 70 };   // ~65 % of the original 98×102 cells (icons are scaled down in css/desktop.css)
  const icons = {};            // id → button
  const binned = [];           // ids sitting in the Recycle Bin
  const rtl = () => document.documentElement.dir === 'rtl';
  ORDER.forEach(id => {
    const a = APPS[id];
    const b = document.createElement('button'); b.className = 'icon'; b.type = 'button'; b.dataset.app = id;
    b.innerHTML = `<div class="tile ${a.tile}">${a.icon}</div><span>${a.title}</span>`;
    b.addEventListener('click', () => { if (!b._dragged) open(id, b); });
    b.addEventListener('contextmenu', e => { e.preventDefault(); contextMenu(id, b, e.clientX, e.clientY); });
    iconDrag(b);
    iconsEl.appendChild(b); icons[id] = b;
  });
  const gridSize = () => { const R = iconsEl.getBoundingClientRect(); return { cols: Math.max(1, Math.floor(R.width / CELL.w)), rows: Math.max(1, Math.floor(R.height / CELL.h)), R }; };
  const cellStyle = (b, c, r) => { const { cols } = gridSize(); b._cell = { c, r }; b.style.left = (rtl() ? (cols - 1 - c) : c) * CELL.w + 'px'; b.style.top = r * CELL.h + 'px'; };
  const taken = (c, r, except) => Object.values(icons).some(x => x !== except && x.isConnected && x._cell && x._cell.c === c && x._cell.r === r);
  function freeCell(nearC, nearR, except) {   // nearest empty cell, scanning outwards; falls back to the first empty one
    const { cols, rows } = gridSize(); let best = null, bd = Infinity;
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) { if (taken(c, r, except)) continue; const d = Math.hypot(c - nearC, r - nearR); if (d < bd) { bd = d; best = { c, r }; } }
    return best || { c: 0, r: 0 };
  }
  function placeIcons() {
    if (isMobile()) { Object.values(icons).forEach(b => { b.style.left = b.style.top = ''; b._cell = null; }); return; }
    const { cols, rows } = gridSize(); let i = 0;
    Object.values(icons).forEach(b => {
      if (!b.isConnected) return;
      if (b._cell && b._cell.c < cols && b._cell.r < rows) { cellStyle(b, b._cell.c, b._cell.r); return; }
      const want = b._cell ? freeCell(Math.min(b._cell.c, cols - 1), Math.min(b._cell.r, rows - 1), b) : freeCell(Math.floor(i / rows), i % rows, b);   // window got smaller → nearest cell that still fits
      cellStyle(b, want.c, want.r); i++;
    });
  }
  // first layout: column-major, in ORDER
  (function () { const { rows } = gridSize(); if (!isMobile()) ORDER.forEach((id, i) => cellStyle(icons[id], Math.floor(i / rows), i % rows)); })();
  addEventListener('resize', placeIcons);
  function iconDrag(b) {
    let sx, sy, moving = false;
    b.addEventListener('pointerdown', e => {
      if (isMobile() || e.button !== 0) return;
      sx = e.clientX; sy = e.clientY; moving = true; b._dragged = false;
      try { b.setPointerCapture(e.pointerId); } catch (_) {}
    });
    b.addEventListener('pointermove', e => {
      if (!moving) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!b._dragged) { if (Math.hypot(dx, dy) < 6) return; b._dragged = true; b.classList.add('dragging'); desk.classList.add('wm-busy'); }
      b.style.transform = `translate(${dx}px, ${dy}px)`;
      const over = dropTarget(b, e.clientX, e.clientY); Object.values(icons).forEach(x => x.classList.toggle('drop-over', x === over));
    });
    const stop = e => {
      if (!moving) return; moving = false;
      if (!b._dragged) return;
      b.classList.remove('dragging'); desk.classList.remove('wm-busy'); b.style.transform = '';
      const over = dropTarget(b, e.clientX, e.clientY); Object.values(icons).forEach(x => x.classList.remove('drop-over'));
      if (over && APPS[over.dataset.app].kind === 'bin' && b.dataset.app !== 'bin') { recycle(b.dataset.app); }
      else {
        const { R, cols, rows } = gridSize();
        const px = e.clientX - R.left - CELL.w / 2, py = e.clientY - R.top - CELL.h / 2;
        let c = Math.round(px / CELL.w); if (rtl()) c = cols - 1 - c;
        c = Math.max(0, Math.min(cols - 1, c)); const r = Math.max(0, Math.min(rows - 1, Math.round(py / CELL.h)));
        const cell = taken(c, r, b) ? freeCell(c, r, b) : { c, r };
        cellStyle(b, cell.c, cell.r);
      }
      setTimeout(() => { b._dragged = false; }, 0);   // the click that follows pointerup must not open the app
    };
    b.addEventListener('pointerup', stop); b.addEventListener('pointercancel', stop);
  }
  function dropTarget(self, x, y) {   // the (other) icon under the pointer, if any
    return Object.values(icons).find(o => { if (o === self || !o.isConnected) return false; const r = o.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; }) || null;
  }
  /* recycle bin */
  function recycle(id) {
    const b = icons[id]; if (!b || !b.isConnected || id === 'bin') return;
    b._home = b._cell; b.remove(); binned.push(id); binBadge(); refreshBin();
  }
  function restoreIcon(id) {
    const i = binned.indexOf(id); if (i < 0) return; binned.splice(i, 1);
    const b = icons[id]; iconsEl.appendChild(b);
    if (!isMobile()) { const h = b._home || { c: 0, r: 0 }; const cell = taken(h.c, h.r, b) ? freeCell(h.c, h.r, b) : h; cellStyle(b, cell.c, cell.r); }
    binBadge(); refreshBin();
  }
  function binBadge() { const t = icons.bin && icons.bin.querySelector('.tile'); if (t) { t.dataset.count = binned.length || ''; t.classList.toggle('full', binned.length > 0); } }
  function refreshBin() { const w = wins.bin; if (w) binView(w.querySelector('.win-body')); }
  function binView(body) {
    body.innerHTML = `<div class="bin-view"><div class="ex-crumb"><b>Recycle Bin</b> <span>· ${binned.length} ${T('items')}</span><span class="sp"></span>${binned.length ? `<button type="button" class="abtn sm restore-all">${T('Restore all')}</button><button type="button" class="abtn sm empty">${T('Empty Recycle Bin')}</button>` : ''}</div>
      ${binned.length ? `<div class="ex-grid"></div>` : `<div class="bin-empty"><div class="big">🗑️</div><p>${T('Recycle Bin is empty.')}</p><p class="dim">${T('Drag a desktop icon onto the bin, or right-click it, to put it here. Refreshing the page brings everything back.')}</p></div>`}</div>`;
    const grid = body.querySelector('.ex-grid');
    if (grid) binned.forEach(id => {
      const a = APPS[id]; const el = document.createElement('div'); el.className = 'ex-item bin-item';
      el.innerHTML = `<span class="f-ico tile ${a.tile}">${a.icon}</span><span class="f-name">${a.title}</span><button type="button" class="abtn sm">${T('Restore')}</button>`;
      el.querySelector('button').addEventListener('click', () => restoreIcon(id)); grid.appendChild(el);
    });
    const ra = body.querySelector('.restore-all'); if (ra) ra.addEventListener('click', () => binned.slice().forEach(restoreIcon));
    const em = body.querySelector('.empty'); if (em) em.addEventListener('click', () => { binned.length = 0; binBadge(); refreshBin(); });
  }
  /* right-click menu on icons */
  const ctx = document.createElement('div'); ctx.className = 'ctx'; ctx.hidden = true; desk.appendChild(ctx);
  function contextMenu(id, b, x, y) {
    const items = [[T('Open'), () => open(id, b)]];
    if (id === 'bin') { if (binned.length) items.push([T('Empty Recycle Bin'), () => { binned.length = 0; binBadge(); refreshBin(); }]); }
    else items.push([T('Move to Recycle Bin'), () => recycle(id)]);
    ctx.innerHTML = ''; items.forEach(([label, fn]) => { const m = document.createElement('button'); m.type = 'button'; m.textContent = label; m.addEventListener('click', () => { ctx.hidden = true; fn(); }); ctx.appendChild(m); });
    const R = desk.getBoundingClientRect(); ctx.hidden = false;
    ctx.style.left = Math.min(x - R.left, R.width - 190) + 'px'; ctx.style.top = Math.min(y - R.top, R.height - 100) + 'px';
  }
  document.addEventListener('pointerdown', e => { if (!ctx.hidden && !ctx.contains(e.target)) ctx.hidden = true; });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') ctx.hidden = true; });

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
  const ALIAS = { youtube: 'social', aparat: 'social', folder: 'projectsFolder', games: 'gamesFolder', recycle: 'bin', trash: 'bin', skin: 'skineditor', skinlookup: 'skineditor', hypixel: 'hyptools', tools: 'hyptools', cps: 'cpstest', notes: 'notepad', status: 'serverstatus', server: 'serverstatus', leaderboard: 'guildboard', guild: 'guildboard', fkdr: 'ratio' };   // old / alternative ids used in links and terminal commands
  function open(id, from, query) {   // query: extra URL params for a page app, e.g. 'u=Notch' opens the Skin Editor on that player
    id = ALIAS[id] || id;
    const a = APPS[id]; if (!a) return false;
    const src = a.kind === 'page' && query ? a.src + (a.src.includes('?') ? '&' : '?') + query : a.src;
    if (wins[id]) { restore(id, from); if (query && a.kind === 'page') { const f = wins[id].querySelector('iframe'); if (f) f.src = src; } return true; }
    const w = document.createElement('div'); w.className = 'win ' + (a.kind === 'terminal' ? 'terminal' : ''); w.dataset.app = id;
    w.innerHTML = `<div class="win-chrome">
        <span class="dot r" title="close"></span><span class="dot y" title="minimize"></span><span class="dot g" title="maximize"></span>
        <span class="win-title">${a.kind === 'terminal' ? 'waish@computer: ~' : a.title}</span>
      </div><div class="win-body"></div>`;
    const body = w.querySelector('.win-body');
    if (a.kind === 'terminal') body.appendChild($('#terminalTemplate').content.cloneNode(true));
    else if (a.kind === 'page') body.innerHTML = `<iframe src="${src}" title="${a.title}" loading="lazy"></iframe>`;
    else if (a.kind === 'explorer') explorer(body);
    else if (a.kind === 'folder') folderView(body, a);
    else if (a.kind === 'bin') binView(body);
    else body.innerHTML = `<div class="app-card">
        <div class="head"><div class="tile ${a.tile}">${a.icon}</div><div><h2>${a.title}</h2><div class="sub">${a.sub || ''}</div></div></div>
        ${a.cover ? `<a class="card-cover" href="${a.cover}" data-caption="${a.title}"><img src="${a.cover}" alt="${a.title}"></a>` : ''}
        <p>${a.text}</p>
        <div class="actions">${a.links.map(([t, h, dis, ic]) => `<a class="btn btn-primary${dis ? ' disabled' : ''}" href="${h}" target="_blank" rel="noopener">${ic && ICONS[ic] ? `<span class="bi">${ICONS[ic]}</span>` : ''}${t}</a>`).join('')}</div>
        <div class="meta">// ${a.meta || ''}</div></div>`;

    // size + position (cascade a little for each new window)
    const R = layer.getBoundingClientRect(); const n = Object.keys(wins).length;
    const W = Math.min(R.width - 40, Math.max(a.minW || 420, R.width * a.w)), H = Math.min(R.height - 30, Math.max(260, R.height * a.h));
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
    else if (APPS[id].kind === 'page') { const f = w.querySelector('iframe'); if (f) { try { f.contentWindow.focus(); } catch (e) {} } }
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
    w.classList.remove('min'); if (wasMin) fitIn(w);
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
  // the browser got smaller (or was un-maximized): fullscreen windows follow the desktop, the others are shrunk / pulled
  // back so nothing ends up off-screen with its title bar out of reach. Minimized windows are fitted when they come back.
  function fitIn(w) {
    if (isMobile() || w.classList.contains('max') || w.classList.contains('min')) return;
    const R = layer.getBoundingClientRect(); if (!R.width || !R.height) return;
    const W = Math.min(parseFloat(w.style.width) || w.offsetWidth, R.width - 20), H = Math.min(parseFloat(w.style.height) || w.offsetHeight, R.height - 20);
    const x = Math.max(0, Math.min(parseFloat(w.style.left) || 0, R.width - W - 10)), y = Math.max(0, Math.min(parseFloat(w.style.top) || 0, R.height - H - 10));
    Object.assign(w.style, { width: W + 'px', height: H + 'px', left: x + 'px', top: y + 'px' });
  }
  addEventListener('resize', () => Object.values(wins).forEach(w => { if (w.classList.contains('max') && !isMobile()) geo(w, fullGeo(), false); else fitIn(w); }));

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

  /* ---------- desktop folder (kind: 'folder') ---------- */
  function folderView(body, a) {
    body.innerHTML = `<div class="folder-view"><div class="ex-crumb"><b>${a.title}</b> <span>· ${a.items.length} ${T('items')}</span></div><div class="ex-grid"></div></div>`;
    const grid = body.querySelector('.ex-grid');
    a.items.forEach(id => {
      const x = APPS[id]; const el = document.createElement('button'); el.type = 'button'; el.className = 'ex-item';
      el.innerHTML = `<span class="f-ico tile ${x.tile}">${x.icon}</span><span class="f-name">${x.title}</span>`;
      el.addEventListener('click', () => open(id, el)); grid.appendChild(el);
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
      main.innerHTML = `<div class="ex-crumb"><button type="button" class="home">This PC</button> › <b>${d.letter}://${d.name}</b> <span>· ${d.items.length} ${T('items')}</span></div><div class="ex-grid" data-gallery></div><div class="ex-note" hidden></div>`;
      main.querySelector('.home').addEventListener('click', home);
      const grid = main.querySelector('.ex-grid'), note = main.querySelector('.ex-note');
      d.items.forEach(it => {
        const el = document.createElement(it.type === 'img' || it.type === 'link' ? 'a' : 'button');
        el.className = 'ex-item';
        if (it.type === 'img') { el.href = it.src; el.dataset.caption = it.name; }   // opens in the site's image viewer (fx.js)
        else if (it.type === 'link') { el.href = it.href; el.target = '_blank'; el.rel = 'noopener'; }
        else el.type = 'button';
        el.innerHTML = `<span class="f-ico">${it.type === 'img' ? `<img src="${it.src}" alt="" loading="lazy">` : it.icon}</span><span class="f-name">${it.name}</span>${it.sub ? `<span class="f-sub">${it.sub}</span>` : ''}`;
        if (it.type === 'txt') el.addEventListener('click', () => { note.textContent = it.text; note.hidden = false; });
        if (it.type === 'run') el.addEventListener('click', () => open(it.app, el));
        grid.appendChild(el);
      });
    }
    home();
  }

  /* ---------- taskbar ---------- */
  const pinnedEl = $('.pinned');
  if (pinnedEl) PINNED.forEach(id => { const a = APPS[id]; const b = document.createElement('button'); b.type = 'button'; b.className = 'task'; b.dataset.app = id; b.title = a.title; b.innerHTML = `<span class="mini tile ${a.tile}">${a.icon}</span><span class="lbl">${a.title}</span>`; b.addEventListener('click', () => toggle(id, b)); pinnedEl.appendChild(b); });
  function addTask() { renderTasks(); }
  function renderTasks() {
    // pinned buttons double as the running indicator (lit when open, dim when minimized)
    if (pinnedEl) pinnedEl.querySelectorAll('.task').forEach((b, i) => { const id = PINNED[i], w = wins[id]; b.classList.toggle('on', !!w && focused === id); b.classList.toggle('min', !!w && w.classList.contains('min')); b.classList.toggle('open', !!w); });
    tasks.innerHTML = '';
    Object.keys(wins).filter(id => !PINNED.includes(id)).forEach(id => {
      const a = APPS[id], w = wins[id];
      const b = document.createElement('button'); b.type = 'button'; b.dataset.app = id;
      b.className = 'task' + (focused === id ? ' on' : '') + (w.classList.contains('min') ? ' min' : '');
      b.innerHTML = `<span class="mini tile ${a.tile}">${a.icon}</span><span class="lbl">${a.title}</span>`; b.title = a.title;
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
      const mt = $('.m-head .m-time'), md = $('.m-head .m-date'); if (mt) mt.textContent = t; if (md) md.textContent = `${j ? j + ' · ' : ''}${g}`;   // phone header
      el.title = (fa ? 'ساعت ایران (UTC+3:30)' : 'Iran Standard Time (UTC+3:30)') + (jalY ? '\n' + jalY.format(d).replace(/ AP$/, '') : '') + (gregY ? '\n' + gregY.format(d) : '');
    };
    tick(); setInterval(tick, 5000);
  })();

  /* ---------- start menu ---------- */
  const startBtn = $('.start'), menu = $('.start-menu');
  if (startBtn && menu) {
    ALL.forEach(id => { const a = APPS[id]; const b = document.createElement('button'); b.type = 'button'; b.innerHTML = `<span class="sm-ico tile ${a.tile}">${a.icon}</span>${a.title}`; b.addEventListener('click', () => { open(id); menu.hidden = true; startBtn.classList.remove('on'); }); menu.querySelector('.sm-apps').appendChild(b); });
    startBtn.addEventListener('click', e => { e.stopPropagation(); menu.hidden = !menu.hidden; startBtn.classList.toggle('on', !menu.hidden); });
    document.addEventListener('pointerdown', e => { if (!menu.hidden && !menu.contains(e.target) && e.target !== startBtn) { menu.hidden = true; startBtn.classList.remove('on'); } });
  }

  // clicking the empty desktop unfocuses
  desk.addEventListener('pointerdown', e => { if (e.target === desk || e.target === iconsEl || e.target.classList.contains('wallpaper')) { Object.values(wins).forEach(x => x.classList.remove('focus')); focused = null; renderTasks(); } });

  return { open, close, minimize, restore, focus, toggle, recycle, apps: () => ALL.map(id => [id, APPS[id].title]) };
})();
