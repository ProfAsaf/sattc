// "It's your turn" alerts for online games. A phone that turns them on gets a
// Web Push subscription (through the service worker, sw.js) and writes it into
// the room; a phone whose move leaves the next one to another player asks the
// alert worker (push/worker.js, on Cloudflare) to wake that player's phone. No
// alert for a player whose game is open in front of them (Net.markSeen).
// On an iPhone this needs iOS 16.4 or later, and the game opened from the
// Home Screen. With no worker set up (push-config.js) all of this stays quiet.
//
// Invites ride the same alerts. A tapped link can't open a Home Screen app on an
// iPhone (it opens Safari), but a tapped alert does: a new room's players can
// wake the players of their last rooms, and a tap on that alert brings each one
// straight into the new room (sw.js leaves the code where the game finds it).

import { PUSH_URL } from './push-config.js';
import * as Net from './net.js';

const WANT = 'collective.alerts'; // '1': this phone wants alerts
const KEY = 'collective.alertKey'; // the worker's public key, as last fetched
const local = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* fine */ } },
};
const b64u = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)), (c) => c.charCodeAt(0));

/** At start-up: the service worker that shows alerts (only once alerts are set up). */
export function start() {
  if (!PUSH_URL || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('sw.js').catch((e) => console.warn('No service worker:', e.message));
}

/** Whether turn alerts are set up at all (a worker to send them). */
export const enabled = () => !!PUSH_URL;

const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const fromHome = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

/**
 * 'none' (no alert worker set up), 'home' (open the game from the Home Screen
 * first), 'old' (this phone can't), 'blocked' (turned off in Settings), 'off', 'on'.
 */
export function status() {
  if (!PUSH_URL) return 'none';
  if (!supported()) return /iPhone|iPad/.test(navigator.userAgent) && !fromHome() ? 'home' : 'old';
  if (Notification.permission === 'denied') return 'blocked';
  return Notification.permission === 'granted' && local.get(WANT) === '1' ? 'on' : 'off';
}

async function serverKey() {
  try {
    const { key } = await (await fetch(`${PUSH_URL}/key`)).json();
    if (key) { local.set(KEY, key); return key; }
  } catch { /* offline: the last one known */ }
  return local.get(KEY);
}

// This phone's subscription (made if need be). One made with another key (the
// worker's changed) can't be woken any more: it is replaced.
async function subscription() {
  // (a service worker that never got going would leave `ready` waiting for ever)
  const reg = await Promise.race([navigator.serviceWorker.ready,
    new Promise((ok, no) => setTimeout(() => no(new Error('Alerts aren’t ready on this phone yet. Try again in a moment.')), 8000))]);
  const key = await serverKey();
  if (!key) throw new Error('The alert service can’t be reached right now.');
  let sub = await reg.pushManager.getSubscription();
  const had = sub?.options?.applicationServerKey;
  if (sub && had && b64u(had) !== key) { await sub.unsubscribe(); sub = null; }
  return sub || reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: unb64u(key) });
}

/**
 * Turn alerts on (from a tap: an iPhone only asks then), for this room and the
 * next ones. In a room, the phone at `seat` gets a first alert at once, so its
 * player sees what they look like (and that they work).
 */
export async function turnOn(code, seat = -1) {
  if ((await Notification.requestPermission()) !== 'granted') return status();
  const sub = await subscription();
  local.set(WANT, '1');
  if (code) {
    await Net.savePush(code, sub.toJSON());
    if (seat >= 0) notify(code, seat, seat, 'hello');
  }
  return status();
}

export async function turnOff(code) {
  local.set(WANT, '0');
  if (code) await Net.savePush(code, null).catch(() => {});
  return status();
}

/** In a room: the room gets this phone's subscription (a new room, or a renewed subscription). */
export async function joinRoom(code) {
  if (!code || status() !== 'on') return;
  try { await Net.savePush(code, (await subscription()).toJSON()); } catch (e) { console.warn('Alerts:', e.message); }
}

/** Ask the worker to wake another player's phone (it says nothing if theirs is off, or they're looking). */
export function notify(code, to, by, kind) {
  if (!PUSH_URL || !code) return;
  fetch(`${PUSH_URL}/notify`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ room: code, to, by, kind }), keepalive: true }).catch(() => {});
}

/** Invite the players of this phone's last rooms (those with alerts on) to room `code`: { sent, names }. */
export async function invite(code) {
  if (!PUSH_URL) return { sent: 0, names: [] };
  const from = Net.recentRooms().filter((x) => x !== code).slice(0, 3);
  const r = await fetch(`${PUSH_URL}/invite`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ room: code, from, by: Net.clientId() }) });
  return r.json();
}

/** A room code from a tapped invite (sw.js keeps it in the cache), once; null if none (or it's old). */
export async function takeInvite() {
  try {
    if (!('caches' in self)) return null;
    const box = await caches.open('collective');
    const r = await box.match('invite');
    if (!r) return null;
    await box.delete('invite');
    const { room, at } = await r.json();
    return Date.now() - at < 30 * 60 * 1000 ? room : null;
  } catch { return null; }
}

/**
 * `fn(code)` for an invite tapped while the game is open (in front, or put
 * away), or one the service worker leaves just after the app has opened (an
 * iPhone may open it before the tap is handled).
 */
export function onInvite(fn) {
  const check = async () => { const code = await takeInvite(); if (code) fn(code); };
  navigator.serviceWorker?.addEventListener('message', (e) => { if (e.data?.invite) check(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
  setTimeout(check, 1500);
  setTimeout(check, 5000);
}
