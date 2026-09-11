---
"@torpor/build": minor
---

Feat: prerendering routes to static HTML

Routes marked with `prerender` are now rendered at build time (`tb build`)
into static HTML files in `dist/client`, so any static host can serve them
with no server. The flag lives on the route's endpoint (`+page.ts` /
`+page.server.ts`) and is inherited from `_layout` endpoints, with
`site.prerender` as a site-level default: a boolean or a map of paths
(`/blog/**` prefixes) with the most specific match winning. Dynamic routes
declare `prerender: { params: [...] }` entries, rendered once each, and the
`_error` page ships as `404.html`. Rendering goes through the normal load
pipeline (hooks, layouts, load functions), so a failing prerender fails the
build, and client navigation falls back to a full page load when a
prerendered site's data can't be fetched.
