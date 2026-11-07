// The game's service worker: only for "it's your turn" alerts and invites
// (js/push.js, push/worker.js). It does not cache or touch any page loads, so
// updates of the game reach phones exactly as before.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

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
