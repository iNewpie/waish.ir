/* ============================================================
   VISITOR BEACON — one tiny anonymous POST per page view to the proxy worker (tools/admin.js → Durable Object).
   Sends only: path, referrer, language. No cookies, nothing stored in the browser; the worker hashes ip+browser+day
   into a visitor id that changes daily and never keeps the IP. The numbers show up at waish.ir/admin.
   Skipped inside the computer's app windows (iframes / ?embed=1), on localhost and for automated browsers.
   ============================================================ */
(function () {
  try {
    if (window.top !== window || new URLSearchParams(location.search).has('embed')) return;
    if (!/^https?:$/.test(location.protocol) || /^(localhost|127\.|\[::1\])/.test(location.hostname) || navigator.webdriver) return;
    var W = 'https://waish-proxy.danesh2242.workers.dev';
    var body = JSON.stringify({ p: location.pathname, r: document.referrer || '', l: navigator.language || '' });
    if (!(navigator.sendBeacon && navigator.sendBeacon(W + '/hit', new Blob([body], { type: 'text/plain' }))))
      fetch(W + '/hit', { method: 'POST', body: body, keepalive: true }).catch(function () {});
  } catch (e) {}
})();
