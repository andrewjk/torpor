---
"@torpor/unplugin": minor
---

Feat: `?client`/`?server` import queries, for SSR and mount tests in one project

With `test: true`, every `.torp` file in a vitest project was forced to
compile for the server, so client-side `mount()` tests were impossible in the
same project (they needed a second vitest project with its own plugin
instance). Importing a component with a `?client` query -- e.g.
`import Counter from "./Counter.torp?client"` -- now compiles it for the
client instead, and the override is passed on to any components it imports,
so its whole tree mounts correctly. A `?server` query does the reverse.
`transform` also no longer mutates the plugin's shared options object
(`dev`, `server`) per request.
