---
"@torpor/view": patch
---

Fix: `mount()`/`hydrate()` now throw on SSR-compiled components

Passing a component compiled with `{ server: true }` (e.g. every `.torp`
import under the unplugin's `test: true` option) to `mount()` rendered
nothing and didn't throw -- the component ran its server render to an HTML
string that went nowhere, with any failure surfacing only as an unhandled
rejection from `serverFlush`. SSR components are always emitted as
`async function`s, so `mount` and `hydrate` now check for that shape up
front (via the intrinsic `AsyncFunction` constructor, which survives
minification) and throw a clear "compiled for SSR" error pointing at the
`?client` import query. The check runs once per mount call, not in any
per-node render path.
