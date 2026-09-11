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
view transitions with scroll restoration (navigations run inside
`document.startViewTransition`; scroll is reset across pages, kept for
same-page navigations, and restored from history state on back/forward),
and ETag/Cache-Control support via `notModified`.

### High impact (table stakes in peers)

1. **Server-side data caching + revalidation** — no `cache()`/`revalidate()`
   style API for load functions, no SWR helpers. (`$cache` in `@torpor/view`
   is sync memoization only; `notModified` is fully manual.)
2. **Streaming SSR** — responses are piped at the transport level, but page
   rendering buffers: `$async { source: "server" }` blocks the render up to
   its timeout rather than flushing the `with` branch and streaming content
   in later (no suspense-style out-of-order streaming).

### Medium

3. **Route-scoped middleware** — already a TODO in `src/server/Server.ts:36`;
   right now it is global `use()` or per-folder hooks only.
4. **WebSockets (server-side)** — SSE exists client-side, but no WS endpoint
   support (adapter-node could do this).
5. **SEO helpers** — no sitemap.xml / robots.txt generation, no meta/canonical
   conveniences beyond `@head` merging.
6. **i18n / locale routing** — nothing.
7. **Flash messages** — DIY via cookies today; a small helper after
   redirects would round out the actions story.

### Lower / nice-to-have

8. Image optimization / asset pipeline beyond Vite defaults
9. Pagination helpers
10. Rate-limiting primitives (fits naturally as a middleware/plugin)
11. Cron / queues / background jobs (adapter-dependent)
12. Dev toolbar / route inspector

Top two if forced to choose: **caching and streaming SSR** — they come up in
virtually every real project.

## Follow-ups from prerendering

- **ISR** — a `revalidate` seconds flag on `+page.server` endpoints, with
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
- **Concurrent prerendering** — render pages in a worker pool; today it is
  sequential, which keeps the module-global `$page` state safe but is slow
  for large sites.
- **`adapter-github-pages`** — a thin adapter adding `.nojekyll` and
  `404.html` conventions on top of the prerendered output.
