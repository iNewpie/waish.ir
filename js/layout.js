/* ============================================================
   SHARED LAYOUT — nav + footer, injected on every page.
   Edit the links here once and every page follows.
   Pages in subfolders set <body data-root="../">.
   ============================================================ */
(function () {
  // embed=1 → page is shown inside a window on computer.html: no nav/footer/particles,
  // and internal links keep the embed flag so they stay inside the window.
  if (new URLSearchParams(location.search).has('embed')) {
    document.body.classList.add('embed');
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]'); if (!a) return;
      const h = a.getAttribute('href');
      if (/^(https?:|#|mailto:)/.test(h) || a.target === '_blank' || h.includes('embed=1')) return;
      a.setAttribute('href', h.includes('?') ? h + '&embed=1' : h + '?embed=1');
    }, true);
    return;
  }
  const root = document.body.dataset.root || '';
  const here = location.pathname.split('/').pop() || 'index.html';
  const links = [
    ['Computer', 'computer.html'],
    ['Projects', 'projects.html'],
    ['About Me', 'about-me.html'],
    ['Contact', 'contact.html'],
  ];
  const nav = document.createElement('nav');
  nav.innerHTML = `<div class="wrap">
    <a class="logo" href="${root}index.html"><span class="lw" data-split>waish</span><span data-split>.ir</span></a>
    <div class="nav-links">${links.map(([t, h]) => `<a href="${root}${h}"${here === h || (h === 'projects.html' && root) ? ' class="on"' : ''}>${t}</a>`).join('')}</div>
  </div>`;
  if (window.I18N) nav.querySelector('.wrap').appendChild(I18N.button());
  document.body.prepend(nav);
  // particles + glow sit behind everything
  if (!document.getElementById('particles')) {
    const c = document.createElement('canvas'); c.id = 'particles';
    const g = document.createElement('div'); g.className = 'glow';
    document.body.prepend(g); document.body.prepend(c);
  }

  const footer = document.createElement('footer');
  footer.innerHTML = `<div class="wrap">
    <div>© <span id="yr"></span> Waish — built and hosted by me.</div>
    <div class="foot-links">
      <a href="https://aparat.com/waish" target="_blank" rel="noopener">aparat</a>
      <a href="#">youtube</a>
      <a href="https://play.lunamc.ir">lunamc</a>
      <a href="https://clutchping.com">clutchping</a>
      <a href="${root}contact.html">contact</a>
    </div>
  </div>`;
  document.body.appendChild(footer);
})();
