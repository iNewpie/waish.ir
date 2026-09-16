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
