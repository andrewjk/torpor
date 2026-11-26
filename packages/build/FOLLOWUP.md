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

### Medium

1. **WebSockets (server-side)** — SSE exists client-side, but no WS endpoint
   support (adapter-node could do this).
2. **i18n / locale routing** — nothing.

### Lower / nice-to-have

3. Image optimization / asset pipeline beyond Vite defaults (see
   **Performance** below)
4. Pagination helpers
5. Rate-limiting primitives (now buildable as a middleware package)
6. Cron / queues / background jobs (adapter-dependent)
7. **Out-of-order HTML streaming** — only if someone needs it. Deferred
   loads (promise values returned from `load`) already stream: the page
   ships with its `with` branches and the values follow as scripts, which is
   the SvelteKit-style approach. What's missing is the React/Solid-style
   variant, where a slow `$async { source: "server" }` boundary flushes its
   `with` branch and its server-rendered HTML is swapped in later; today
   such a boundary holds the response up to its timeout (counted from the
   start of the render). It would mean rebuilding view's server renderer
   around chunks, and streamed pages lose late status codes and redirects,
   head data from inside boundaries, `event.cache()` from the render, and
   ETags/304s, so it should be opt-in per boundary or route if it's done.
8. Dev toolbar / route inspector

Nothing here is table stakes any more; server-side WebSockets is the most
likely to come up.

## Performance

Gaps found by checking torpor against the practices in "Performance is
design" (shannadige.com, Oct 2026): what a framework should make easy so that
fast sites are the default. Already covered: SSR and prerendering by
default, HTML caching with ETags/304s, year-long `immutable` caching of
hashed assets (Node and Cloudflare), `modulepreload` and stylesheet links for each
page's client chunks (component styles arrive once, as cached files), a build report of the JavaScript each page loads (with
`site.budgets`), a small compiled runtime (the docs
site's entry script is ~23 KB gzipped), deferred loads, and hover/focus
prefetch. In rough order of value:

1. **Pending state for navigation and form submits.** `$page` has no
   `navigating` or `submitting` flag, so showing immediate feedback on a
   slow submit (a disabled or busy button, so it isn't tapped twice) or a
   slow navigation means wiring it up by hand. Something like
   `$page.navigating` (the target URL while a navigation's data loads) and a
   per-form submitting state from `formSubmit.ts` would cover it; the
   `@torpor/ui` button could use it.
2. **Pages that ship no JavaScript.** Every page loads the client entry and
   hydrates its whole component tree, even pure content (blog posts, docs).
   A route/layout flag (like SvelteKit's `csr = false`) that leaves out the
   client scripts would make static pages zero-JS, at the cost of client
   navigation from them. For pages that are mostly static with a few heavy
   interactive parts, a deferred block (`@defer (on: "visible") { ... }`,
   designed in `packages/view/FOLLOWUP.md` under "Features") fits torpor
   better than Astro-style islands, which would need hydration to start
   from component boundaries rather than the root.
3. **Images.** No helper for responsive sizes (`srcset`/`sizes` from one
   source image at build time), for loading the largest above-the-fold
   image eagerly with `fetchpriority="high"`, or for lazy-loading the rest
   with reserved dimensions (no layout shift). A build-time image component
   or Vite plugin integration would cover it.
4. **Fonts.** No help preloading the fonts a page's CSS uses, or setting
   `font-display`, so custom fonts can delay text or shift layout.
5. **Inline small stylesheets.** Pages now link their component
   stylesheets (`<link rel="stylesheet">` from the client manifest, see
   `pageAssets` in `site/serverHandlers.ts`) rather than inlining each
   component's `<style>`, so each style arrives once and later pages reuse
   the cached files. The cost is a render-blocking request per stylesheet
   on a cold first visit, where inline styles arrived with the HTML. If that
   shows up in first paint, inline stylesheets under a size threshold
   (SvelteKit's `inlineStyleThreshold`), and stop the client loading the
   same file again: Vite's preload helper skips a stylesheet only when a
   `<link>` for it exists, so an inlined one needs either a placeholder
   (e.g. a disabled `<link>` with the same href) or a patched preload
   helper.
6. **Check base path sites' stylesheets.** Not verified: with
   `site.basePath`, the server's stylesheet links get the base (via
   `rewriteBaseInHtml`), but Vite's preload helper builds its URLs from
   Vite's own `base`, which the build doesn't set. So on a client
   navigation to a page with new stylesheets, the helper may request
   `/assets/x.css` without the base (and not recognise the server's
   `/app/assets/x.css` links as the same file). This predates the
   stylesheet links (client navigation always relied on the helper); setting
   Vite's `base` from `site.basePath` for the client build is the likely fix.

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
