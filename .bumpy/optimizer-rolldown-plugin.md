---
"@torpor/build": patch
"@torpor/ui": patch
---

Fix: dep optimizer gets a rolldown-shaped plugin

The dev server's dep optimizer is a rolldown build, but it was given the
esbuild-shaped plugin from `@torpor/unplugin/esbuild` -- whose `setup(build)`
hooks rolldown silently ignores -- so `.torp` files in optimized dependencies
were parsed as plain JavaScript and failed. It now gets the vite/rolldown
export, which rolldown understands.

Also declares a `torpor` field in `@torpor/ui`'s package.json so
`findTorporPackages` detects it: registry installs are then excluded from dep
optimization (rolldown's optimizer can't bundle the css that compiled
components emit) and bundled for SSR automatically, without sites having to
configure `optimizeDeps.exclude`/`ssr.noExternal` themselves. The `torpor`
field can now be `"torpor": true` as well as a path, for packages that ship
compiled output and just want to mark themselves as torpor packages.
