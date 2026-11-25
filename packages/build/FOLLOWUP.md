# Follow-ups

## Bugs

Findings from a review of `packages/build` (2026-11-24). "Confirmed" items
were reproduced with throwaway tests through `createServerLoad` (since
deleted); the rest come from reading the source.

### Middleware on `_layout.server.ts` is silently ignored (confirmed)

Layout server endpoints share the `PageServerEndPoint` type, which accepts
`middleware`, but `createServerLoad` and `loadPageData` only collect
middleware from the page's own endpoint. A guard on
`/admin/_layout.server.ts` (`middleware: [{ enter: () => unauthorized() }]`)
let `GET /admin/secret` through with a 200. Either run layout middleware
for every page under the layout (outermost first), or reject `middleware`
on layout endpoints at type and runtime level so it can't be mistaken for a
guard. Folder hooks (`_hook.server.ts`) do guard subtrees; the docs should
point people there.

### Client navigations queue instead of the latest winning

`nav/navigate.ts` chains every navigation onto `pendingNavigation`, and the
data fetch in `nav/loadData.ts` has no `AbortSignal` or timeout. Clicking a
slow link and then a fast one renders the slow page first, then the fast
one; clicking several links renders each in turn; and a hung `/~server`
request blocks all further client navigation until it settles. Abort (or
ignore the result of) superseded navigations and let the newest one win.

### Smaller issues

- **Form and query fields named like `Object.prototype` members are
  dropped**: `formDataToRecord` and `searchParamsToRecord` skip a key when
  `key in result`, which is already true for `constructor`, `toString`,
  `valueOf` etc. (It does stop `__proto__` pollution, but by losing the
  data.) Use `Object.hasOwn`, or build the record on `Object.create(null)`.
- **Validation runs before hooks in actions**: `runAction` parses and
  validates the form against the action's schema before the folder hooks
  (e.g. an auth hook) run, so unauthenticated users get schema validation
  errors back. Run hooks first, as loads do.
- **No origin check on form actions**: CSRF protection relies entirely on
  the `SameSite=lax` default in `CookieHelper`. Checking `Origin` against
  the request host for non-GET form posts (SvelteKit's `checkOrigin`) would
  be cheap defense in depth.
- **Module-global base path**: `createServerLoad` calls `setBasePath`, a
  module global, so two sites with different bases in one process (tests,
  multi-tenant servers) overwrite each other. It could be scoped per site
  the way the page state is now kept per request (`site/requestPage.ts`).
- **A reused layout's context additions don't reach the new page**: when
  client navigation keeps a layout and refills its slot (`nav/navigate.ts`),
  the slot function is called with the root context (`$page`,
  `TorporBuildContext`), not the context the layout built up, so anything a
  layout puts into `$context` for its pages is missing after a navigation
  that reuses it. The layout's own `$context` would need to be kept with its
  slot region in `client.layoutStack`.
- **`rewriteBaseInHtml` rewrites by regex over the whole document**, so
  `href="/…"` / `src="/…"` text inside `<pre>`/`<code>` samples or inline
  scripts is rewritten too.
- **`secure: true` by default** in `CookieHelper` means sessions and flash
  messages don't stick in browsers that refuse `Secure` cookies over plain
  `http://localhost` (older Safari), with no warning in dev.

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
take `middleware: [...]` for route-scoped guards, both before folder hooks),
and ETag/Cache-Control support via `notModified`. Discovery helpers exist
too: `seo()` (in `@torpor/build/discovery`) builds page head data (title,
description, Open Graph/Twitter metas via a `{ property, content }` head
variant), endpoint `head` data is now rendered at render time, and
`site.sitemap` writes a build-time sitemap of the prerendered pages or
serves one at runtime from a `{ get }` config (needing `site.origin`); and
robots.txt stays a plain host file (with `src/public` files served in dev
and copied into the build output).

### High impact (table stakes in peers)

1. **Server-side data caching + revalidation** — no `cache()`/`revalidate()`
   style API for load functions, no SWR helpers. (`$cache` in `@torpor/view`
   is sync memoization only; `notModified` is fully manual.)
2. **Streaming SSR** — responses are piped at the transport level, but page
   rendering buffers: `$async { source: "server" }` blocks the render up to
   its timeout rather than flushing the `with` branch and streaming content
   in later (no suspense-style out-of-order streaming).

### Medium

3. **WebSockets (server-side)** — SSE exists client-side, but no WS endpoint
   support (adapter-node could do this).
4. **i18n / locale routing** — nothing.

### Lower / nice-to-have

5. Image optimization / asset pipeline beyond Vite defaults
6. Pagination helpers
7. Rate-limiting primitives (now buildable as a middleware package)
8. Cron / queues / background jobs (adapter-dependent)
9. Dev toolbar / route inspector

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
- **Concurrent prerendering** — render pages concurrently (or in a worker
  pool); today it is sequential, which is slow for large sites. The page
  state is now kept per request (`site/requestPage.ts`), so it no longer forces this,
  but the module-global base path still would.
- **`adapter-github-pages`** — a thin adapter adding `.nojekyll` and
  `404.html` conventions on top of the prerendered output.
