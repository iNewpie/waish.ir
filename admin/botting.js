// Minecraft access tokens stay in the companion's memory. Only pairing and UI preferences
// use this tab's sessionStorage so a dashboard refresh can reconnect to the running app.
(() => {
  const el = id => document.getElementById(id);
  const endpoint = 'http://127.0.0.1:47836';
  const pairingStorage = 'waish-companion-pairing', leaderStorage = 'waish-companion-leader';
  function stored(name) { try { return sessionStorage.getItem(name) || ''; } catch { return ''; } }
  function remember(name, value) { try { if (value) sessionStorage.setItem(name, value); else sessionStorage.removeItem(name); } catch {} }
  let pairingKey = stored(pairingStorage), poll = null, busy = false, data = null, generation = 0, active = false, messageUntil = 0;
  let accessRequest = null;
  if (!/^[a-f0-9]{64}$/.test(pairingKey)) { pairingKey = ''; remember(pairingStorage, ''); }
  el('botLeader').value = stored(leaderStorage);
  el('botLeader').addEventListener('input', () => remember(leaderStorage, el('botLeader').value.trim()));
  const text = (tag, value, cls) => { const n = document.createElement(tag); n.textContent = value; if (cls) n.className = cls; return n; };
  function message(value, error = false) { el('botMsg').textContent = value; el('botMsg').className = 'msg' + (error ? ' err' : ''); messageUntil = Date.now() + 8000; }
  async function call(path, body) {
    const headers = { 'X-Waish-Key': pairingKey };
    if (body) headers['Content-Type'] = 'application/json';
    let r;
    try { r = await fetch(endpoint + path, { method: body ? 'POST' : 'GET', headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(12000), cache: 'no-store', credentials:'omit', redirect:'error', targetAddressSpace:'loopback' }); }
    catch { el('botAccessSettings').open = true; throw new Error('App unreachable. Open Waish Companion on this PC, then click Allow local connection above. If access was blocked, follow No permission popup?'); }
    const d = await r.json();
    if (!r.ok) throw Object.assign(new Error(d.cause || 'The app could not complete this request.'), { status:r.status });
    return d;
  }
  function offline() {
    data = null; el('botService').textContent = '❌ App not connected'; el('botService').className = 'bot-state bot-warn';
    el('botAdd').disabled = true; el('botAccounts').replaceChildren(text('div', 'Connect the companion app to see current account status.', 'bot-empty'));
    el('botTarget').textContent = 'Waiting for a fresh location from Lunar.'; el('botCount').textContent = '— / 3 accounts';
  }
  function render(d) {
    data = d;
    el('botService').textContent = d.running ? '✅ App running' : '❌ App stopped';
    el('botService').className = 'bot-state ' + (d.running ? 'bot-live' : 'bot-warn');
    el('botAdd').disabled = !d.running || d.accounts.length >= 3 || busy;
    el('botCount').textContent = `${d.accounts.length} / 3 accounts`;
    const p = d.player;
    el('botTarget').textContent = p ? `${p.server} · ${p.mode || p.gametype || 'Lobby'}${p.map ? ' · ' + p.map : ''}` : 'Waiting for a fresh location from Lunar. Install the tracker and join Hypixel.';
    const list = el('botAccounts'); list.replaceChildren();
    if (!d.accounts.length) list.append(text('div', d.running ? 'No accounts yet. Add your first Minecraft Java session.' : 'Press Start in the app to begin.', 'bot-empty'));
    for (const a of d.accounts) {
      const card = text('article', '', 'bot-account'); const head = text('div', '', 'bot-head');
      head.append(text('h3', a.username || a.label));
      const names = { connected:'✅ Connected', validating:'⏳ Checking token', connecting:'⏳ Connecting', disconnected:'❌ Disconnected', error:'❌ Failed' };
      head.append(text('span', names[a.state] || '❌ Unknown', 'bot-state'));
      card.append(head);
      if (a.username && a.label !== a.username) card.append(text('div', a.label, 'bot-small'));
      if (a.reason) card.append(text('p', a.reason, 'bot-meta'));
      const loc = a.location;
      card.append(text('div', loc ? `${loc.server} · ${loc.mode || loc.gametype || 'Lobby'}${loc.map ? ' · ' + loc.map : ''}` : 'Instance: not confirmed', 'bot-meta'));
      card.append(text('div', a.sameInstance === true ? '✅ Same instance as you' : a.sameInstance === false ? 'Different instance' : 'Your instance match is not confirmed', a.sameInstance === true ? 'bot-meta bot-match' : 'bot-meta'));
      const actions = text('div', '', 'bot-actions');
      for (const [action, label] of [['connect','Connect'], ['disconnect','Disconnect'], ['locate','Refresh location'], ['lobby','Bed Wars lobby'], ['party','Accept my invite'], ['solo','Queue Solo'], ['remove','Remove']]) {
        const btn = text('button', label, 'btn btn-ghost sm'); btn.type = 'button';
        const inProgress = ['validating','connecting','connected'].includes(a.state);
        btn.disabled = busy || !d.running || (action === 'connect' && inProgress) || (['locate','lobby','party','solo'].includes(action) && a.state !== 'connected');
        btn.addEventListener('click', () => act({ id:a.id, action, ...(action === 'party' ? { leader:el('botLeader').value.trim() } : {}) }));
        actions.append(btn);
      }
      card.append(actions); list.append(card);
    }
  }
  async function refresh() {
    if (!pairingKey || busy || accessRequest || !active || document.hidden) return;
    const g = generation;
    try { const d = await call('/status'); if (g === generation && !busy) { remember(pairingStorage, pairingKey); render(d); if (Date.now() > messageUntil) message('Status updated ' + new Date().toLocaleTimeString()); } }
    catch (e) { if (g === generation && !busy) {
      if (e.status === 401) { pairingKey = ''; remember(pairingStorage, ''); }
      offline(); message(e.message, true);
    } }
  }
  async function act(body) {
    if (busy) return; busy = true; if (data) render(data);
    const g = ++generation;
    try { const d = await call('/accounts/action', body); if (g === generation) { render(d); message('Request sent. Watch the account status for the result.'); } }
    catch (e) { if (g === generation) message(e.message, true); }
    finally { busy = false; if (g === generation && data) render(data); }
  }
  el('botPairForm').addEventListener('submit', async e => {
    e.preventDefault(); pairingKey = el('botPairKey').value.trim(); el('botPairKey').value = '';
    ++generation; remember(pairingStorage, '');
    if (!/^[a-f0-9]{64}$/.test(pairingKey)) { pairingKey = ''; offline(); message('Copy the complete pairing code from the app.', true); return; }
    message('Connecting to your PC…'); await refresh();
  });
  el('botAccountForm').addEventListener('submit', async e => {
    e.preventDefault(); if (busy) return;
    const token = el('botToken').value.trim(), label = el('botLabel').value.trim();
    el('botToken').value = ''; busy = true; if (data) render(data); const g = ++generation;
    try { const d = await call('/accounts/add', { token, label }); if (g === generation) { render(d); el('botLabel').value = ''; message('Account added. Checking the session and connecting…'); } }
    catch (e) { if (g === generation) message(e.message, true); }
    finally { busy = false; if (g === generation && data) render(data); }
  });
  async function requestLocalAccess() {
    if (accessRequest || busy) return;
    const request = {}; accessRequest = request;
    const g = ++generation, button = el('botAllowLocal'), note = el('botAccessMsg');
    button.disabled = true; button.textContent = 'Waiting for browser…';
    note.textContent = 'Choose Allow in the browser prompt. Waish Companion must be open on this PC.';
    try {
      // Start fetch directly in the click handler, before any await, to retain user activation.
      // A readable 401 confirms access to the app; account data still requires its pairing key.
      const r = await fetch(endpoint + '/status', {
        method:'GET', headers:pairingKey ? { 'X-Waish-Key':pairingKey } : {},
        cache:'no-store', credentials:'omit', redirect:'error', targetAddressSpace:'loopback', signal:AbortSignal.timeout(60000)
      });
      if (g !== generation) return;
      if (r.status === 401) {
        pairingKey = ''; remember(pairingStorage, ''); offline();
        note.textContent = '✅ Local connection works. Paste the current pairing code below and click Connect app.';
      } else if (r.ok) {
        const d = await r.json();
        if (g !== generation) return;
        render(d); remember(pairingStorage, pairingKey);
        note.textContent = '✅ Local connection works. The companion is connected.';
      } else throw new Error('The app refused the local request.');
      el('botAccessSettings').open = false;
      message('Local connection checked.');
    } catch {
      if (g !== generation) return;
      let denied = false;
      for (const name of ['loopback-network', 'local-network-access']) {
        try { const p = await navigator.permissions.query({ name }); denied = p.state === 'denied'; break; } catch {}
      }
      if (g !== generation) return;
      note.textContent = denied
        ? 'Browser access is blocked. Follow No permission popup? to allow it in this site’s permissions, then retry.'
        : 'Could not reach the app. Keep Waish Companion open and retry. If no popup appears, follow No permission popup? below.';
      el('botAccessSettings').open = true;
    } finally {
      if (accessRequest === request) { accessRequest = null; button.disabled = false; button.textContent = 'Allow local connection'; }
    }
  }
  el('botAllowLocal').addEventListener('click', requestLocalAccess);
  el('botRefresh').addEventListener('click', refresh);
  window.waishBotting = {
    activate(value) { if (active !== value) ++generation; active = value; clearInterval(poll); if (value) { refresh(); poll = setInterval(refresh, 3000); } },
    logout() { active = false; pairingKey = ''; data = null; ++generation; accessRequest = null; el('botAllowLocal').disabled = false; el('botAllowLocal').textContent = 'Allow local connection'; el('botAccessMsg').textContent = ''; clearInterval(poll); remember(pairingStorage, ''); remember(leaderStorage, ''); el('botLeader').value = ''; el('botToken').value = ''; el('botPairKey').value = ''; offline(); }
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  offline();
})();
