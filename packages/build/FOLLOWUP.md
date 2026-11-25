# Follow-ups

## Missing framework features

A gap analysis of `packages/build` against commonly needed features in peer
meta-frameworks (Next, Nuxt, SvelteKit, Astro, TanStack Start, Hono).

What already exists: file + code routing, layouts, `_error` pages, per-folder
hooks, global middleware (`Server.use()`), cookies (`CookieHelper`), form
actions with Standard Schema validation and file upload support (`readForm`
reads `File` values), client-side navigation with hover/focus prefetch, SSE
client helper (`$stream(fromServer(...))`), OpenAPI generation + docs UI,
test utilities, node/cloudflare adapters with auto-detection, typed env
access (`env()` with optional `site.env` schema validation and adapter-level
`TorporEnv` key merging), a signed-cookie session helper (`ev.session` with
`get`/`set`/`regenerate`/`destroy`), prerendering (route/layout/site
`prerender` flags rendered by `runPrerender` into `dist/client`, params
entries for dynamic routes, error page as `404.html`), base path config
(`site.basePath` strips the prefix from server requests, rewrites generated
HTML attributes and redirect locations, and mirrors on the client router),
view transitions with scroll restoration (`site.viewTransitions = true` opts
navigations into running inside `document.startViewTransition`; scroll is
always reset across pages, kept for same-page navigations, and restored from
history state on back/forward),
flash messages (`event.flash.set(...)` riding a one-read cookie, consumed
into `$context.$page.flash` by the render pipeline), route middleware (`site.middleware`
runs globally for every request -- unmatched ones too -- and server endpoints
take `middleware: [...]` for route-scoped guards, run after folder hooks),
and HTTP caching (`event.cache()` for `Cache-Control`/`Vary`, private by
default for responses that read or set cookies, content ETags and 304s on
pages and client data responses, `dedupe()` for once-per-request calls,
and `event.waitUntil()` for background work; a cross-request data cache is
deliberately left to the db/ORM or the app's own cache layer). Discovery helpers exist
too: `seo()` (in `@torpor/build/discovery`) builds page head data (title,
description, Open Graph/Twitter metas via a `{ property, content }` head
variant), endpoint `head` data is now rendered at render time, and
`site.sitemap` writes a build-time sitemap of the prerendered pages or
serves one at runtime from a `{ get }` config (needing `site.origin`); and
robots.txt stays a plain host file (with `src/public` files served in dev
and copied into the build output).

### High impact (table stakes in peers)

1. **Streaming SSR** — responses are piped at the transport level, but page
   rendering buffers: `$async { source: "server" }` blocks the render up to
   its timeout rather than flushing the `with` branch and streaming content
   in later (no suspense-style out-of-order streaming).

### Medium

2. **WebSockets (server-side)** — SSE exists client-side, but no WS endpoint
   support (adapter-node could do this).
3. **i18n / locale routing** — nothing.

### Lower / nice-to-have

4. Image optimization / asset pipeline beyond Vite defaults
5. Pagination helpers
6. Rate-limiting primitives (now buildable as a middleware package)
7. Cron / queues / background jobs (adapter-dependent)
8. Dev toolbar / route inspector

Top one if forced to choose: **streaming SSR** — it comes up in virtually
every real project.

## Follow-ups from prerendering

- **ISR** (opt-in, for sites happy to serve slightly old pages; separate
  from the HTTP caching above) — a `revalidate` seconds flag on `+page.server` endpoints, with
  per-adapter runtimes: a cache middleware/HTML cache with TTL for the node
  adapter (serve fresh cached HTML, regenerate stale in the background) and
  Cache API wiring for Cloudflare. Static hosts can't do it.
- **Data files for static SPA navigation** — emit a JSON data file next to
  each prerendered page's HTML and teach client `loadData` to fetch it, so
  client-side navigation and data hydration work fully on static hosts.
  (Today a data-fetch failure there falls back to a full page load.)
- **Crawling** — follow `<a href>` links in prerendered output to warn about
  pages that are linked from prerendered pages but not prerendered
  themselves (SvelteKit-style completeness check).
- **Concurrent prerendering** — render pages concurrently (or in a worker
  pool); today it is sequential, which is slow for large sites. The page
  state is now kept per request (`site/requestPage.ts`), so it no longer forces this,
  but the module-global base path still would.
- **`adapter-github-pages`** — a thin adapter adding `.nojekyll` and
  `404.html` conventions on top of the prerendered output.
