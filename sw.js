// The game's service worker: only for "it's your turn" alerts (js/push.js,
// push/worker.js). It does not cache or touch any page loads, so updates of
// the game reach phones exactly as before.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// An alert: { title, body, room }. iPhones insist that every push shows one.
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data?.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'The Collective', {
    body: d.body || 'Your move.',
    tag: `collective-${d.room || 'game'}`, // a newer alert from the same game takes the older one's place
    renotify: true,
    icon: 'icons/icon-192.png',
    data: { room: d.room || '' },
  }));
});

// A tap on an alert: back to the game (the app goes straight to the last game it was in).
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const open = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of open) if ('focus' in c) return c.focus();
    return self.clients.openWindow('./');
  })());
});
