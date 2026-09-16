---
"@torpor/build": patch
---

Fix: warm the dev server before listening

The dev server performed its first dependency optimization right
after printing "Listening on ...", reloading and resetting any
in-flight connections -- clients saw an empty reply until it
settled. `runDev` now loads the SSR entry before binding the
listener, so the first optimization (and the optimizer-driven
reload) completes before the port is open.
