# Turn alerts

`worker.js` is a small Cloudflare Worker (free plan) that wakes a player's
phone when it's their move in an online game. The game itself is a static
page and Firebase can't send alerts, so a phone that makes a move asks the
worker to send the next player a Web Push.

- The game (`js/push.js`) subscribes a phone that turns alerts on and writes
  the subscription into the room (`rooms/{code}/push/{player id}`).
- While a player has the game in front of them, their seat says so
  (`rooms/{code}/seen/{player id}`) and the worker leaves them alone.
- The worker makes its VAPID key pair on first use and keeps it in KV: there
  is no secret to copy anywhere.
- `sw.js` (at the site root) shows the alert and opens the game when it's tapped.
- Invites (`POST /invite`): a new room's lobby can wake the players of the
  inviter's earlier rooms who have alerts on; a tap on that alert brings them
  into the room (`sw.js` leaves the code in the cache for the game to find).

iPhones get alerts from iOS 16.4 on, and only when the game was opened from
its Home Screen icon.

## Deploy (once)

From this folder, with a Cloudflare account:

```
npx wrangler login
npx wrangler kv namespace create collective-push
```

Put the id it prints into `wrangler.toml` (it holds the one made on
2026-11-06), then:

```
npx wrangler deploy
```

It prints the worker's address (`https://collective-push.<you>.workers.dev`).
Put that into `../js/push-config.js` as `PUSH_URL`, run `node tools/stamp.mjs`
and publish the game.

## Check it

`GET /key` answers with the public key. The crypto is checked in Node against
Mozilla's own Web Push library (decrypting what the worker sends, and
verifying its VAPID signature).
