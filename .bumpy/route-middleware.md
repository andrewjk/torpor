---
"@torpor/build": minor
---

Feat: route middleware

`site.middleware` sets global middleware, run for every request before
routing -- including requests that won't match a route, so maintenance
mode, legacy url redirects and custom error handling are expressible.
Server endpoints (`+page.server.ts`, `+server.ts`) take
`middleware: [...]` for route-scoped guards, which run after the global
middleware and before folder hooks, so a guard can skip data loading
entirely. Both use the same shape: `enter` runs in order and may return a
Response to short-circuit; `exit` runs in reverse and can inspect `ev.error`.
Middleware see the raw request url. The existing low-level `Server.use()`
is unchanged and stays internal -- packages can push middleware onto
`site.middleware` from a site plugin, which is how shippable cross-cutting
features (rate limiting, auth) should attach.
