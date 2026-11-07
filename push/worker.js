// "It's your turn" alerts for The Collective: a Cloudflare Worker.
//
// The game is a static page (GitHub Pages) and online games live in Firebase's
// Realtime Database, so nothing there can wake a phone. This can: when a phone
// makes a move that leaves the next one to another player, it asks here, and
// this sends that player's phone a Web Push (on an iPhone, the game must be on
// the Home Screen). Deploy: see README.md in this folder.
//
//   GET  /key        the public key phones subscribe with (VAPID)
//   POST /notify     { room, to, by, kind }: room is the four-letter code, to and
//                    by are seats, kind is 'turn' | 'attacked' | 'move' | 'start', or
//                    'hello' (to the phone that just turned alerts on: in a lobby too, and
//                    even while it's looking, so its player sees what alerts look like)
//
// Who gets what is read from the room itself: rooms/{code}/info (the seats),
// rooms/{code}/push/{player id} (the phone's subscription, written by the
// game) and rooms/{code}/seen/{player id} (a heartbeat while the game is open
// in front of them: no alert then). A phone gets at most one alert every few
// seconds. The VAPID key pair is made here on first use and kept in KV, so no
// secret ever leaves Cloudflare. Bindings: KV namespace PUSH.

const DB = 'https://the-collective-71ffd-default-rtdb.firebaseio.com';
const SUBJECT = 'https://profasaf.github.io/sattc/';
const ORIGINS = new Set(['https://profasaf.github.io', 'http://localhost:8770', 'http://127.0.0.1:8770']);
const LOOKING_MS = 30000; // their game was in front of them this recently: no alert
const GAP_S = 8;          // at most one alert per phone this often

export default {
  async fetch(req, env) {
    const cors = {
      'Access-Control-Allow-Origin': ORIGINS.has(req.headers.get('Origin')) ? req.headers.get('Origin') : 'https://profasaf.github.io',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      Vary: 'Origin',
    };
    const reply = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    const { pathname } = new URL(req.url);
    try {
      if (pathname === '/key') return reply({ key: (await vapid(env)).pub });
      if (pathname === '/notify' && req.method === 'POST') return reply(await notify(env, JSON.parse(await req.text())));
      return reply({ error: 'not found' }, 404);
    } catch (e) {
      return reply({ error: String(e?.message || e) }, 500);
    }
  },
};

async function notify(env, { room, to, by, kind }) {
  if (!/^[A-Z]{4}$/.test(room || '') || !Number.isInteger(to) || !Number.isInteger(by)) return { sent: false, why: 'bad request' };
  const get = async (path) => (await fetch(`${DB}/rooms/${room}/${path}.json`)).json();
  const [info, push, seen] = await Promise.all([get('info'), get('push'), get('seen')]);
  const hello = kind === 'hello';
  const P = info?.players?.[to], Q = info?.players?.[by];
  if (!P || !Q || (info.status !== 'playing' && !hello)) return { sent: false, why: 'no such game or seat' };
  const sub = push?.[P.id]?.sub;
  if (!sub?.endpoint || !sub?.keys) return { sent: false, why: 'alerts are off on that phone' };
  if (!hello && Date.now() - (seen?.[P.id] || 0) < LOOKING_MS) return { sent: false, why: 'they are looking at the game' };
  const gate = `gap:${room}:${P.id}`;
  if (Date.now() - Number(await env.PUSH.get(gate) || 0) < GAP_S * 1000) return { sent: false, why: 'just sent one' };
  await env.PUSH.put(gate, String(Date.now()), { expirationTtl: 60 });
  const who = Q.name || 'Someone';
  const say = {
    turn: ['Your turn', `${who} is done. Your turn in The Collective.`],
    attacked: ['You’re attacked!', `${who} attacks you. Tap to block.`],
    move: ['Your move', `Your move in the game with ${who}.`],
    start: ['The game is on', `${who} started the game. Choose your opening hand.`],
    hello: ['🔔 Alerts are on', 'This is how The Collective will tell you it’s your turn.'],
  }[kind] || ['Your move', 'Your move in The Collective.'];
  const res = await sendPush(sub, { title: say[0], body: say[1], room }, await vapid(env));
  return { sent: res.ok, status: res.status };
}

// ── Web Push (RFC 8030), VAPID (RFC 8292), aes128gcm (RFC 8291) ─────────
const te = new TextEncoder();
const b64u = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)), (c) => c.charCodeAt(0));
const cat = (...parts) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) { out.set(p, at); at += p.length; }
  return out;
};

// The VAPID key pair: made once, kept in KV.
async function vapid(env) {
  let jwk = await env.PUSH.get('vapid', 'json');
  if (!jwk) {
    const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
    await env.PUSH.put('vapid', JSON.stringify(jwk));
  }
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  return { key, pub: b64u(cat(new Uint8Array([4]), unb64u(jwk.x), unb64u(jwk.y))) };
}

async function vapidAuth(endpoint, v) {
  const part = (o) => b64u(te.encode(JSON.stringify(o)));
  const unsigned = `${part({ typ: 'JWT', alg: 'ES256' })}.${part({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: SUBJECT })}`;
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, v.key, te.encode(unsigned));
  return `vapid t=${unsigned}.${b64u(sig)}, k=${v.pub}`;
}

async function hkdf(salt, ikm, info, bytes) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, bytes * 8));
}

// The message, encrypted for that one phone (only it can read it).
async function encrypt(sub, text) {
  const ua = unb64u(sub.keys.p256dh), auth = unb64u(sub.keys.auth);
  const mine = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPub = new Uint8Array(await crypto.subtle.exportKey('raw', mine.publicKey));
  const theirs = await crypto.subtle.importKey('raw', ua, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: theirs }, mine.privateKey, 256));
  const ikm = await hkdf(auth, shared, cat(te.encode('WebPush: info\0'), ua, asPub), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, te.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, te.encode('Content-Encoding: nonce\0'), 12);
  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, cat(te.encode(text), new Uint8Array([2]))));
  const head = new Uint8Array(21 + asPub.length);
  head.set(salt, 0);
  new DataView(head.buffer).setUint32(16, 4096);
  head[20] = asPub.length;
  head.set(asPub, 21);
  return cat(head, sealed);
}

async function sendPush(sub, message, v) {
  return fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      Authorization: await vapidAuth(sub.endpoint, v),
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: '86400',
      Urgency: 'high',
    },
    body: await encrypt(sub, JSON.stringify(message)),
  });
}
