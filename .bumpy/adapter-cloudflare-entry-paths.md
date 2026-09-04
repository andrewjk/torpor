---
"@torpor/adapter-cloudflare": patch
---

Fix: the Cloudflare adapter now points the dev template and the production worker's
`Server` import at the compiled dist entries of `@torpor/build`, falling back
to source files only when the framework is symlinked into the app (or
`TORPOR_SOURCE_DEV` is set), matching the new source-mode behavior of `tb`.
