---
"@torpor/build": patch
---

Fix: the site entry files (clientEntry, clientEntryDev, serverEntry) and the dev
runtime are now compiled into dist, and registry installs run them instead of
raw sources — previously `tb` loaded `.ts` files from the installed package's
src folder, which broke consumer apps with "Failed to resolve import" errors
when src wasn't shipped. Source mode (running framework `.ts` directly, so
changes take effect without a rebuild) is now opt-in: it activates when
`@torpor/build` and `@torpor/view` are both symlinked into the app from
outside node_modules, or when the `TORPOR_SOURCE_DEV` env var is set. The
`@torpor/build/dev` export gained a compiled `dist/dev.mjs` target alongside
its source condition.
