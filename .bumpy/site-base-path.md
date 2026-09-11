---
"@torpor/build": minor
---

Feat: site base path

`site.basePath = "/app"` mounts the site under a subpath. The server strips
the prefix from incoming URLs before routing (requests that don't carry it
aren't served), and adds it back to generated HTML attributes (href, action,
src), redirect locations and paths built with `route()` -- so server code,
markup and params all stay base-free, with the config as the single source
of truth. The client router mirrors the server: it strips the base before
matching links on click, prefetch and back/forward navigation, and keeps it
in browser state and data fetches. Base path is inherited by prerendered
output (its links carry the prefix), and static deploys go to the
subdirectory the base path points at.
