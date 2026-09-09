---
"@torpor/build": minor
---

Feat: when a site doesn't set an adapter, one is resolved automatically at
build/preview time -- a deployment environment (e.g. `CF_PAGES` for
Cloudflare Pages) picks the platform's adapter when installed, an installed
`@torpor/adapter-*` package is used otherwise (preferring node), and as a
last resort preview serves the built output on the current runtime (Bun or
Deno natively; node needs `@torpor/adapter-node`). The chosen adapter is
logged, and `serve` may now be async.
