/* ============================================================
   SHARED FX — particles, scroll reveal, kicker typewriter,
   heading scramble, letter split. Used by every page.
   ============================================================ */
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// split letters for hover-bounce (logo, project titles)
function splitLetters(el) { el.innerHTML = [...el.textContent].map((c, i) => `<span class="l" style="transition-delay:${i * 25}ms">${c === ' ' ? '&nbsp;' : c}</span>`).join(''); }
document.querySelectorAll('[data-split]').forEach(splitLetters);

// typewriter kickers on reveal
async function typeKicker(el) {
  const text = el.dataset.type; if (el.dataset.done) return; el.dataset.done = 1;
  if (reduce) { el.textContent = text; return; }
  for (let i = 1; i <= text.length; i++) { el.textContent = text.slice(0, i); await sleep(28); }
}

// scramble/decode headings on reveal
const CHARS = '!<>-_\\/[]{}—=+*^?#░▒▓';
async function scramble(el) {
  if (el.dataset.done) return; el.dataset.done = 1;
  const final = el.textContent; if (reduce) return;
  const total = 14;
  for (let f = 0; f <= total; f++) {
    let out = '';
    for (let i = 0; i < final.length; i++) {
      if (final[i] === ' ') { out += ' '; continue; }
      const settled = i < (f / total) * final.length;
      out += settled ? final[i] : `<span class="sc">${CHARS[Math.floor(Math.random() * CHARS.length)]}</span>`;
    }
    el.innerHTML = out; await sleep(45);
  }
  el.textContent = final;
}

// red particle field
(function () {
  const canvas = document.getElementById('particles'); if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, parts = [], mouse = { x: -999, y: -999 };
  function resize() { w = canvas.width = innerWidth; h = canvas.height = innerHeight; }
  resize(); addEventListener('resize', resize);
  addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  const N = Math.min(70, Math.floor(innerWidth / 18));
  for (let i = 0; i < N; i++) parts.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: Math.random() * 1.8 + .6, a: Math.random() * .5 + .25 });
  function step() {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]; p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1; if (p.y < 0 || p.y > h) p.vy *= -1;
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
      if (d < 120) { p.x += (dx / d) * 1.2; p.y += (dy / d) * 1.2; }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,59,59,${p.a})`; ctx.fill();
      for (let j = i + 1; j < parts.length; j++) {
        const q = parts[j], dd = Math.hypot(p.x - q.x, p.y - q.y);
        if (dd < 120) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.strokeStyle = `rgba(255,59,59,${.1 * (1 - dd / 120)})`; ctx.lineWidth = 1; ctx.stroke(); }
      }
    }
    requestAnimationFrame(step);
  }
  if (!reduce) step(); else parts.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,59,59,${p.a * .6})`; ctx.fill(); });
})();

// scroll reveal + text triggers (call after dynamic content is rendered)
function observeReveals() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      e.target.querySelectorAll('[data-type]').forEach(typeKicker);
      e.target.querySelectorAll('[data-scramble]').forEach(scramble);
      io.unobserve(e.target);
    });
  }, { threshold: .12 });
  document.querySelectorAll('.reveal:not(.in)').forEach(el => io.observe(el));
}

const yr = document.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();

/* ---------- lightbox: image links open inside the site instead of a new tab ----------
   Any <a href="….jpg|png|gif|webp|avif|svg"> is handled automatically.
   Links inside the same [data-gallery] (or the same parent) become one gallery with ‹ › arrows.
   Opt out per link with data-no-lightbox. Caption: data-caption, else the <img alt>, else the link text. */
const IMG_RE = /\.(jpe?g|png|gif|webp|avif|svg)(\?.*)?$/i;
function openLightbox(src, opts = {}) {
  let lb = document.getElementById('lightbox');
  if (!lb) {
    lb = document.createElement('div'); lb.id = 'lightbox'; lb.hidden = true; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('data-i18n-skip', '');
    lb.innerHTML = `<div class="lb-back"></div>
      <figure class="lb-fig"><img alt=""><figcaption></figcaption></figure>
      <button type="button" class="lb-x" aria-label="close" title="close (Esc)">×</button>
      <button type="button" class="lb-nav lb-prev" aria-label="previous" title="previous (←)">‹</button>
      <button type="button" class="lb-nav lb-next" aria-label="next" title="next (→)">›</button>
      <div class="lb-count"></div>`;
    document.body.appendChild(lb);
    const img = lb.querySelector('img'), cap = lb.querySelector('figcaption'), count = lb.querySelector('.lb-count');
    lb._show = i => {
      const items = lb._items; if (!items.length) return;
      lb._i = (i + items.length) % items.length; const it = items[lb._i];
      img.classList.add('swap'); img.src = it.src; img.alt = it.caption || '';
      img.onload = () => img.classList.remove('swap');
      cap.textContent = it.caption || ''; cap.hidden = !it.caption;
      count.textContent = items.length > 1 ? `${lb._i + 1} / ${items.length}` : ''; lb.classList.toggle('single', items.length < 2);
    };
    lb._close = () => { lb.classList.remove('on'); document.documentElement.classList.remove('lb-open'); clearTimeout(lb._t); lb._t = setTimeout(() => { lb.hidden = true; img.removeAttribute('src'); }, 240); };
    lb.querySelector('.lb-back').addEventListener('click', lb._close); lb.querySelector('.lb-x').addEventListener('click', lb._close);
    lb.querySelector('.lb-prev').addEventListener('click', () => lb._show(lb._i - 1)); lb.querySelector('.lb-next').addEventListener('click', () => lb._show(lb._i + 1));
    img.addEventListener('click', () => { if (lb._items.length > 1) lb._show(lb._i + 1); });
    document.addEventListener('keydown', e => {
      if (lb.hidden) return;
      if (e.key === 'Escape') lb._close(); else if (e.key === 'ArrowLeft') lb._show(lb._i - 1); else if (e.key === 'ArrowRight') lb._show(lb._i + 1); else return;
      e.preventDefault();
    });
    // swipe on touch screens
    let tx = null; lb.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', e => { if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; tx = null; if (Math.abs(dx) > 40) lb._show(lb._i + (dx < 0 ? 1 : -1)); });
  }
  lb._items = (opts.items && opts.items.length) ? opts.items : [{ src, caption: opts.caption || '' }];
  const idx = opts.index != null ? opts.index : Math.max(0, lb._items.findIndex(x => x.src === src));
  clearTimeout(lb._t); lb.hidden = false; lb._show(idx);
  document.documentElement.classList.add('lb-open');
  requestAnimationFrame(() => lb.classList.add('on'));
  lb.querySelector('.lb-x').focus({ preventScroll: true });
}
document.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (!a || a.hasAttribute('download') || a.hasAttribute('data-no-lightbox') || a.target === '_blank') return;
  if (!IMG_RE.test(a.getAttribute('href')) || e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;
  e.preventDefault(); e.stopPropagation();
  const caption = x => x.dataset.caption || (x.querySelector('img') && x.querySelector('img').alt) || x.textContent.trim();
  const scope = a.closest('[data-gallery]') || a.parentElement;
  const links = [...scope.querySelectorAll('a[href]')].filter(x => IMG_RE.test(x.getAttribute('href')) && !x.hasAttribute('data-no-lightbox'));
  openLightbox(a.href, { items: links.map(x => ({ src: x.href, caption: caption(x) })), index: Math.max(0, links.indexOf(a)) });
}, true);


/* ---------- profile thumbnail wall (index About section + about-me hero) ----------
   Drop YouTube thumbnails into assets/thumbs/ named 1.jpg, 2.jpg, 3.jpg … (png / webp work too).
   They are found automatically, in order, stopping at the first missing number.
   To use your own file names instead, list them here: THUMBS = ['assets/thumbs/bedwars.jpg', …] */
const THUMBS = ['assets/thumbs/1.jpg', 'assets/thumbs/2.jpg', 'assets/thumbs/3.jpg', 'assets/thumbs/4.jpg', 'assets/thumbs/5.jpg', 'assets/thumbs/6.jpg', 'assets/thumbs/7.jpg', 'assets/thumbs/8.jpg', 'assets/thumbs/9.jpg', 'assets/thumbs/10.jpg'];   // add new ones here (an empty list turns the 1.jpg, 2.jpg… auto-discovery back on)
(async function thumbWall() {
  const wall = document.getElementById('thumbWall'); if (!wall) return;
  const root = document.body.dataset.root || '';
  const ROWS = 3, PER = 7;
  const render = list => {
    wall.innerHTML = '';
    for (let r = 0; r < ROWS; r++) {
      const row = document.createElement('div'); row.className = 'thumb-row';
      const tiles = [];
      for (let i = 0; i < PER; i++) {
        const src = list.length ? list[(i + r * 3) % list.length] : null;
        tiles.push(src ? `<img src="${src}" alt="" decoding="async">` : `<span class="ph" style="--i:${(i + r * 2) % 5}"></span>`);
      }
      row.innerHTML = tiles.join('') + tiles.join('');   // doubled so the slow drift loops seamlessly
      wall.appendChild(row);
    }
    wall.classList.toggle('placeholder', !list.length);
  };
  render([]);   // placeholders are built but stay invisible (no .ready) while the real thumbnails load
  // gentle parallax on the about-me hero
  const hero = wall.closest('.profile-hero');
  if (hero && !matchMedia('(prefers-reduced-motion: reduce)').matches) hero.addEventListener('pointermove', e => { const r = hero.getBoundingClientRect(); wall.style.setProperty('--px', ((e.clientX - r.left) / r.width - .5) * -24 + 'px'); wall.style.setProperty('--py', ((e.clientY - r.top) / r.height - .5) * -14 + 'px'); });
  const load = src => new Promise(r => { const i = new Image(); i.onload = () => r(src); i.onerror = () => r(null); i.src = src; });
  let list = THUMBS.map(t => root + t);
  if (!list.length) for (let n = 1; n <= 60; n++) {
    let hit = null;
    for (const ext of ['jpg', 'png', 'webp', 'jpeg']) { hit = await load(`${root}assets/thumbs/${n}.${ext}`); if (hit) break; }
    if (!hit) break; list.push(hit);
  }
  if (list.length) {
    render(list);
    // every tile is already in the browser cache from the probe above; wait for them to decode, then fade the wall in
    // (capped at 5 s so a browser that never settles decode() can't keep the wall hidden forever)
    await Promise.race([Promise.all([...wall.querySelectorAll('img')].map(img => (img.decode ? img.decode() : Promise.resolve()).catch(() => {}))), sleep(5000)]);
  }
  requestAnimationFrame(() => wall.classList.add('ready'));   // no thumbnails at all → the placeholders fade in instead
})();
