---
"@torpor/adapter-cloudflare": minor
---

- `cloudflareDev` now accepts a `main` option so adapters can point dev mode at their own worker entry

- `cloudflareDev` excludes `@torpor/build` from the workerd `ssr` environment's dependency optimizer
