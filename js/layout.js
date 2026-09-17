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
      if (/^(https?:|#|mailto:)/.test(h) || a.target === '_blank' || h.includes('embed=1') || /\.(jpe?g|png|gif|webp|avif|svg)(\?.*)?$/i.test(h)) return;
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

  const SOCIAL = [
    ['YouTube', 'https://www.youtube.com/@WaishChannel', '<svg viewBox="0 0 24 24"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z"/></svg>'],
    ['Aparat', 'https://aparat.com/waish', `<img src="${root}assets/aparat-logo.png" alt="">`],
    ['Instagram', 'https://instagram.com/asunawaish', '<svg viewBox="0 0 24 24"><path d="M12 2.2c3.2 0 3.6 0 4.8.1 3.2.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 4 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2zM12 0C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1 0 8.3 0 8.7 0 12s0 3.7.1 4.9c.2 4.4 2.6 6.8 7 7 1.2.1 1.6.1 4.9.1s3.7 0 4.9-.1c4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9c-.2-4.4-2.6-6.8-7-7C15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.4 1.4 0 1 0 0 2.9 1.4 1.4 0 0 0 0-2.9z"/></svg>'],
    ['Telegram', 'https://t.me/wishingcommunity', '<svg viewBox="0 0 24 24"><path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm5.6 8.2-2 9.3c-.1.7-.5.8-1.1.5l-3-2.2-1.5 1.4c-.2.2-.3.3-.6.3l.2-3 5.6-5c.2-.2 0-.3-.3-.1l-6.9 4.3-3-.9c-.6-.2-.7-.6.2-1l11.6-4.5c.5-.2 1 .1.8.9z"/></svg>'],
    ['Discord', 'https://discord.gg/8HVsMqucZ2', '<svg viewBox="0 0 24 24"><path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.2.4a18 18 0 0 1 4.4 1.5 16 16 0 0 0-15.2 0A18 18 0 0 1 8.8 3.4L8.6 3a19.7 19.7 0 0 0-4.9 1.5C.6 9.1-.3 13.6.2 18a20 20 0 0 0 6 3l1.3-2.1a13 13 0 0 1-2-1l.5-.4a14.3 14.3 0 0 0 12.2 0l.5.4a13 13 0 0 1-2 1l1.3 2.1a19.8 19.8 0 0 0 6-3c.6-5.1-.9-9.6-3.7-13.6zM8.5 15.3c-1.2 0-2.1-1.1-2.1-2.4s.9-2.4 2.1-2.4 2.2 1.1 2.1 2.4c0 1.3-.9 2.4-2.1 2.4zm7 0c-1.2 0-2.1-1.1-2.1-2.4s.9-2.4 2.1-2.4 2.2 1.1 2.1 2.4c0 1.3-.9 2.4-2.1 2.4z"/></svg>'],
  ];
  const footer = document.createElement('footer');
  footer.innerHTML = `<div class="wrap">
    <div class="foot-copy">© <span id="yr"></span> Waish.ir — Built and hosted by Hossein Danesh.</div>
    <div class="foot-right">
      <div class="foot-social">${SOCIAL.map(([n, h, ic]) => `<a href="${h}" target="_blank" rel="noopener" title="${n}" aria-label="${n}" data-i18n-skip>${ic}</a>`).join('')}</div>
      <div class="foot-links">
        <a href="https://play.lunamc.ir">lunamc</a>
        <a href="https://clutchping.com">clutchping</a>
        <a href="https://nairo.ir" target="_blank" rel="noopener">nairoshop</a>
        <a href="https://coffeebede.com/waishchannel" target="_blank" rel="noopener">donate</a>
      </div>
    </div>
  </div>`;
  document.body.appendChild(footer);
})();
