// The game's service worker: "it's your turn" alerts and invites (js/push.js,
// push/worker.js), and a copy of the game's files on the phone, so that when
// the phone closes the page (the white flash) the game comes back at once,
// even with no signal. Asaf, 2026-11-12: "have it always be able to super
// quickly come back to where it was". Updates still reach phones as before:
//  - the page itself comes from the network whenever it answers within 1.5 s,
//    so a new version shows at once; from the phone only when the network is
//    slow or gone;
//  - a script or stylesheet whose address carries ?v= (all of them:
//    tools/stamp.mjs) never changes, so once it's on the phone it comes from
//    there;
//  - anything else of the game's (pictures, sprites, moves) comes from the
//    network as before, and from the phone only when the network fails or
//    takes over 1.5 s.
// An old version's files are cleared out whenever a fresh page comes in, and
// ?fresh=1 on the game's address clears the whole copy (js/app.js).

const FILES = 'collective-files';
const WAIT = 1500; // ms the network has before the phone's copy is used

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const url = new URL(r.url), scope = new URL(self.registration.scope);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname) || url.pathname.endsWith('/sw.js')) return;
  if (r.mode === 'navigate') e.respondWith(page(r));
  else if (url.searchParams.has('v')) e.respondWith(kept(r));
  else e.respondWith(fresh(r));
});

const later = (ms) => new Promise((r) => setTimeout(r, ms));
async function keep(key, res) {
  if (!res || !res.ok || res.type !== 'basic') return;
  await (await caches.open(FILES)).put(key, res);
}
async function copyOf(key) {
  try { return (await (await caches.open(FILES)).match(key)) || null; } catch { return null; }
}
// From the network, kept on the phone as it comes; the phone's copy if the
// network fails, or is still waited for after WAIT ms (then the network's
// answer still goes on into the copy, for next time).
async function netOr(r, key) {
  const net = fetch(r).then((res) => { keep(key, res.clone()).catch(() => {}); return res; });
  const slow = later(WAIT).then(async () => (await copyOf(key)) || net);
  try {
    return await Promise.race([net, slow]);
  } catch (err) {
    const c = await copyOf(key);
    if (c) return c;
    throw err;
  }
}

// the page (one copy, whatever follows its address); a fresh one clears out
// an old version's files. It gets a second from the network (none when the
// phone says it has no connection), then the copy is used.
async function page(r) {
  const key = new URL('./', self.registration.scope).href;
  const net = fetch(r).then((res) => {
    if (res.ok && res.type === 'basic') {
      keep(key, res.clone()).catch(() => {});
      prune(res.clone()).catch(() => {});
    }
    return res;
  });
  const slow = later(self.navigator.onLine === false ? 0 : 1000).then(async () => (await copyOf(key)) || net);
  try {
    return await Promise.race([net, slow]);
  } catch (err) {
    const c = await copyOf(key);
    if (c) return c;
    throw err;
  }
}

// a file with ?v=: from the phone once it's there
async function kept(r) {
  const c = await copyOf(r);
  if (c) return c;
  const res = await fetch(r);
  keep(r, res.clone()).catch(() => {});
  return res;
}

// anything else of the game's
const fresh = (r) => netOr(r, r);

// The ?v= files the page names are this version's; any other ?v= file kept is
// an old version's, and goes.
async function prune(res) {
  const html = await res.text();
  const scope = self.registration.scope;
  const now = new Set([...html.matchAll(/["']((?:\.\/)?[\w./-]+\?v=\w+)["']/g)].map((m) => new URL(m[1], scope).href));
  if (now.size < 10) return; // (not the page we know: leave the copy be)
  const c = await caches.open(FILES);
  for (const req of await c.keys()) if (new URL(req.url).searchParams.has('v') && !now.has(req.url)) await c.delete(req);
}

// An alert: { title, body, room, kind }. iPhones insist that every push shows one.
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data?.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'The Collective', {
    body: d.body || 'Your move.',
    tag: `collective-${d.kind === 'invite' ? 'invite-' : ''}${d.room || 'game'}`, // a newer alert from the same game takes the older one's place
    renotify: true,
    icon: 'icons/icon-192.png',
    data: { room: d.room || '', kind: d.kind || '' },
  }));
});

// A tap on an alert: back to the game (the app goes straight to the last game it
// was in). A tap on an invite: into the room it's for. iPhones may open the app
// without the address given here, so the room's code also waits in the cache,
// where the game looks when it opens or comes to the front (Push.takeInvite).
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const { room, kind } = e.notification.data || {};
  const invite = kind === 'invite' && /^[A-Z]{4}$/.test(room || '');
  e.waitUntil((async () => {
    if (invite) await (await caches.open('collective')).put('invite', new Response(JSON.stringify({ room, at: Date.now() })));
    const open = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of open) {
      if (!('focus' in c)) continue;
      if (invite) c.postMessage({ invite: room });
      return c.focus();
    }
    return self.clients.openWindow(invite ? `./?invite=${room}` : './');
  })());
});
