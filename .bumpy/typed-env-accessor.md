---
"@torpor/build": minor
"@torpor/adapter-cloudflare": patch
---

New `env()` in `@torpor/build/env` returns the server environment -- `process.env` on
Node (with `.env` files loaded by the CLI) and the platform environment, with bindings,
on Cloudflare. Its type comes from the `TorporEnv` global interface, declared in three
layers: `@torpor/build` reserves framework keys (`TORPOR_SESSION_SECRET`), adapters add
their platform's keys (the Cloudflare adapter declares `ASSETS`), and apps merge their
own in an ambient `src/env.d.ts`. For runtime checking, set a Standard Schema on
`site.env` in site.config.ts -- `env()` then validates on first use per request and
throws with the schema's issues, so a missing or invalid key fails immediately instead
of passing `undefined` along.
