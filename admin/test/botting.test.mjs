import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../botting.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const admin = html.split('<script>')[1].split('/* ---------- login ---------- */')[0];
const key = 'a'.repeat(64), pairingStorage = 'waish-companion-pairing';
const flush = () => new Promise(resolve => setImmediate(resolve));

class Element {
  value = ''; textContent = ''; children = []; disabled = false; listeners = {};
  classList = { toggle() {} };
  addEventListener(type, handler) { this.listeners[type] = handler; }
  setAttribute() {}
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  async fire(type) { await this.listeners[type]?.({ preventDefault() {} }); }
}

function page({ storage = new Map(), request, blockedStorage = false, permissionQuery } = {}) {
  const elements = new Map(), timers = new Map(), requests = [];
  const el = id => { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); };
  const sessionStorage = {
    getItem(name) { if (blockedStorage) throw Error('Blocked'); return storage.get(name) ?? null; },
    setItem(name, value) { if (blockedStorage) throw Error('Blocked'); storage.set(name, value); },
    removeItem(name) { if (blockedStorage) throw Error('Blocked'); storage.delete(name); }
  };
  const context = vm.createContext({
    document: { hidden:false, getElementById:el, createElement:() => new Element(), addEventListener() {} },
    window:{}, sessionStorage, localStorage:{ getItem:() => 'fake-admin-session', removeItem() {} },
    AbortSignal, observeReveals() {},
    navigator:{ permissions:{ query:permissionQuery || (async () => { throw Error('Permission API unsupported'); }) } },
    setInterval(fn) { const id = {}; timers.set(id, fn); return id; },
    clearInterval(id) { timers.delete(id); },
    async fetch(url, options) { requests.push({ url, ...options }); return request(url, options); }
  });
  vm.runInContext(source, context);
  vm.runInContext(admin, context);
  vm.runInContext('loadStats = () => {}; loadPacks = () => {}; show(!!token);', context);
  return { el, requests, context, tick:async () => { for (const fn of [...timers.values()]) await fn(); await flush(); } };
}
const response = (value, status = 200) => ({ ok:status === 200, status, json:async () => value });
const emptyStatus = { running:true, accounts:[], player:null };

test('refresh restores pairing, selected section, username and authoritative account status without resending tokens', async () => {
  const storage = new Map();
  const state = { ...emptyStatus, accounts:[] };
  const request = async (url, options) => {
    assert.equal(options.headers['X-Waish-Key'], key);
    if (url.endsWith('/accounts/add')) state.accounts.push({ id:'account-1', username:'TestPlayer', label:'Test', state:'connected' });
    return response(structuredClone(state));
  };
  const first = page({ storage, request });
  await first.el('bottingTab').fire('click');
  first.el('botPairKey').value = key;
  await first.el('botPairForm').fire('submit');
  first.el('botLeader').value = 'PartyLeader';
  await first.el('botLeader').fire('input');
  first.el('botToken').value = 'fake-minecraft-token';
  await first.el('botAccountForm').fire('submit');
  assert.equal(first.el('botCount').textContent, '1 / 3 accounts');
  assert.equal(first.el('botToken').value, '');
  assert.deepEqual([...storage.keys()].sort(), ['waish-admin-section', 'waish-companion-leader', pairingStorage].sort());
  assert.ok(!JSON.stringify([...storage]).includes('fake-minecraft-token'));

  const refreshed = page({ storage, request });
  await flush();
  assert.equal(refreshed.requests.length, 1);
  assert.ok(refreshed.requests[0].url.endsWith('/status'));
  assert.equal(refreshed.el('botService').textContent, '✅ App running');
  assert.equal(refreshed.el('botCount').textContent, '1 / 3 accounts');
  assert.equal(refreshed.el('botLeader').value, 'PartyLeader');
  assert.equal(refreshed.el('botAccounts').children[0].children[0].children[0].textContent, 'TestPlayer');
});

test('temporary connection failure keeps pairing and polling reconnects to the existing accounts', async () => {
  const storage = new Map([[pairingStorage,key], ['waish-admin-section','botting']]);
  let available = false;
  const p = page({ storage, request:async () => { if (!available) throw Error('Offline'); return response(emptyStatus); } });
  await flush();
  assert.equal(storage.get(pairingStorage), key);
  assert.equal(p.el('botCount').textContent, '— / 3 accounts');
  available = true;
  await p.tick();
  assert.equal(p.el('botService').textContent, '✅ App running');
});

test('restarted app rejects old pairing, then accepts a newly entered code', async () => {
  const storage = new Map([[pairingStorage,key], ['waish-admin-section','botting']]);
  const newKey = 'b'.repeat(64);
  const p = page({ storage, request:async (_, options) => options.headers['X-Waish-Key'] === newKey ? response(emptyStatus) : response({ cause:'Copy the new code from the app.' }, 401) });
  await flush();
  assert.equal(storage.has(pairingStorage), false);
  await p.tick();
  assert.equal(p.requests.length, 1);
  p.el('botPairKey').value = newKey;
  await p.el('botPairForm').fire('submit');
  assert.equal(storage.get(pairingStorage), newKey);
  assert.equal(p.el('botService').textContent, '✅ App running');
});

test('logout clears pairing and UI preferences and prevents an in-flight response restoring them', async () => {
  const storage = new Map([[pairingStorage,key], ['waish-admin-section','botting'], ['waish-companion-leader','PartyLeader']]);
  let finish;
  const p = page({ storage, request:() => new Promise(resolve => { finish = resolve; }) });
  vm.runInContext('logout()', p.context);
  finish(response(emptyStatus));
  await flush();
  assert.equal(storage.size, 0);
  assert.equal(p.el('botLeader').value, '');
  assert.equal(p.el('botService').textContent, '❌ App not connected');
  await p.tick();
  assert.equal(p.requests.length, 1);
});

test('blocked session storage still allows manual pairing for the current page', async () => {
  const p = page({ blockedStorage:true, request:async () => response(emptyStatus) });
  await p.el('bottingTab').fire('click');
  p.el('botPairKey').value = key;
  await p.el('botPairForm').fire('submit');
  assert.equal(p.el('botService').textContent, '✅ App running');
});

test('overview does not contact the companion until Botting is opened', async () => {
  const storage = new Map([[pairingStorage,key], ['waish-admin-section','overview']]);
  const p = page({ storage, request:async () => response(emptyStatus) });
  await flush();
  assert.equal(p.requests.length, 0);
  await p.el('bottingTab').fire('click');
  await flush();
  assert.equal(p.requests.length, 1);
  assert.equal(p.el('botService').textContent, '✅ App running');
});

test('local access button starts a fresh loopback request on every click without requiring pairing', async () => {
  const p = page({ request:async () => response({},401) });
  await p.el('bottingTab').fire('click');
  const firstClick = p.el('botAllowLocal').fire('click');
  assert.equal(p.requests.length,1,'fetch starts synchronously in the user gesture');
  await firstClick;
  assert.match(p.el('botAccessMsg').textContent,/Local connection works/);
  assert.match(p.el('botAccessMsg').textContent,/pairing code/);
  await p.el('botAllowLocal').fire('click');
  assert.equal(p.requests.length,2);
  for(const request of p.requests) {
    assert.equal(request.url,'http://127.0.0.1:47836/status');
    assert.equal(request.method,'GET');
    assert.equal(request.targetAddressSpace,'loopback');
    assert.equal(request.credentials,'omit');
    assert.equal(request.headers['X-Waish-Key'],undefined);
    assert.equal(request.body,undefined);
  }
  assert.equal(p.el('botAllowLocal').disabled,false);
});

test('denied browser permission opens site-permission instructions and permits retry', async () => {
  const queries = [];
  const p = page({
    request:async () => { throw Error('Blocked by browser'); },
    permissionQuery:async ({name}) => { queries.push(name); if(name === 'loopback-network') throw Error('Unsupported name'); return {state:'denied'}; }
  });
  await p.el('botAllowLocal').fire('click');
  assert.deepEqual(queries,['loopback-network','local-network-access']);
  assert.match(p.el('botAccessMsg').textContent,/Browser access is blocked/);
  assert.equal(p.el('botAccessSettings').open,true);
  await p.el('botAllowLocal').fire('click');
  assert.equal(p.requests.length,2);
  assert.equal(p.el('botAllowLocal').disabled,false);
});

test('manual local access reconnects paired accounts and pauses competing status polls while pending', async () => {
  const storage = new Map([[pairingStorage,key],['waish-admin-section','botting']]);
  let complete;
  let manual = false;
  const p = page({storage,request:async () => {
    if(!manual) throw Error('Prompt was dismissed');
    return new Promise(resolve => {complete=resolve;});
  }});
  await flush();
  manual=true;
  const pending=p.el('botAllowLocal').fire('click');
  await p.tick();
  await p.el('botAllowLocal').fire('click');
  assert.equal(p.requests.length,2,'one initial poll and one manual request');
  complete(response({...emptyStatus,accounts:[{id:'existing',label:'Existing account',state:'connected'}]}));
  await pending;
  assert.equal(p.el('botService').textContent,'✅ App running');
  assert.equal(p.el('botCount').textContent,'1 / 3 accounts');
  assert.equal(storage.get(pairingStorage),key);
  assert.equal(p.el('botAllowLocal').disabled,false);
});

test('logout ignores a late permission-check response', async () => {
  let complete;
  const p=page({request:() => new Promise(resolve => {complete=resolve;})});
  const pending=p.el('botAllowLocal').fire('click');
  vm.runInContext('logout()',p.context);
  complete(response(emptyStatus));
  await pending;
  assert.equal(p.el('botAccessMsg').textContent,'');
  assert.equal(p.el('botService').textContent,'❌ App not connected');
  assert.equal(p.el('botAllowLocal').disabled,false);
});