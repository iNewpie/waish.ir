/* ============================================================
   INDEX PAGE — project data, hero animations, mini terminal
   ============================================================ */
const T = window.I18N ? I18N.t : s => s;
const ROLES = ["content creator", "LunaMC founder", "ClutchPing founder", "SEO expert", "streamer", "3D artist", "offline-AI tinkerer"].map(T);

/* ---------- hero text animations ---------- */
// headline word rise + shimmer
(function () {
  const h = document.getElementById('headline');
  const words = h.textContent.trim().split(/\s+/);
  h.innerHTML = words.map((w, i) => `<span class="w" style="animation-delay:${200 + i * 70}ms">${w}</span>`).join(' ');
  if (reduce) return;
  // once every word has risen, flatten back to plain text (background-clip:text
  // can't paint through animated child spans), run the shimmer once, then restore.
  setTimeout(() => {
    h.textContent = words.join(' ');
    h.classList.add('shine');
    h.addEventListener('animationend', () => h.classList.remove('shine'), { once: true });
  }, 200 + words.length * 70 + 700);
})();
// hero paragraph line-by-line rise
(function () {
  const p = document.getElementById('heroP');
  const lines = p.textContent.split('\n');
  p.innerHTML = lines.map((l, i) => `<span class="ln" style="animation-delay:${900 + i * 160}ms">${T(l.trim())}</span>`).join('');
})();
// rotating role typewriter
(async function () {
  const el = document.getElementById('typedRole');
  if (reduce) { el.textContent = ROLES[0]; return; }
  let i = 0;
  while (true) {
    const w = ROLES[i % ROLES.length];
    for (let c = 1; c <= w.length; c++) { el.textContent = w.slice(0, c); await sleep(55); }
    await sleep(1400);
    for (let c = w.length; c >= 0; c--) { el.textContent = w.slice(0, c); await sleep(28); }
    await sleep(250); i++;
  }
})();
typeKicker(document.getElementById('kicker'));

/* ---------- mini terminal ---------- */
const term = initTerminal({ body: document.getElementById('termBody'), input: document.getElementById('cmdInput'), mode: 'mini' });
term.print(`${T('Type')} <span class="out-blue">/help</span> ${T('for commands, or just ask me something — English or فارسی.')} <span class="out-dim">(<span class="out-blue">/computer</span> ${T('for the full experience)')}</span>`, 'out-dim');

function copyIP(btn) { navigator.clipboard?.writeText('Play.LunaMC.iR'); const s = btn.querySelector('small'); s.textContent = 'copied ✔'; setTimeout(() => s.textContent = 'click to copy', 1600); }

observeReveals();

