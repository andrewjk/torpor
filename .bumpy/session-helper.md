---
"@torpor/build": minor
---

Server events now have a `session` helper for reading and writing a signed cookie, in
load functions, actions, `+server.ts` endpoints and hooks. The value is signed with
HMAC-SHA256 (Web Crypto, so it works on Node and Cloudflare) using the
`TORPOR_SESSION_SECRET` environment key. The API is deliberately low-level and
storage-free: `get` verifies the signature and expiry and returns the data, `set`
writes it (keeping the session id stable), `regenerate` writes with a fresh id for
login and privilege changes, and `destroy` deletes the cookie. The stable `id` doubles
as a database key for apps that need revocation: store it server-side, check it on each
authed request, and delete the row to revoke. Session data must be JSON-safe and fit
in a cookie (~4KB); the default expiry is 30 days (`{ maxAge }` to change).
