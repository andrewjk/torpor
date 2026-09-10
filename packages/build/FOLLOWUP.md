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
`get`/`set`/`regenerate`/`destroy`), and ETag/Cache-Control support via
`notModified`.

### High impact (table stakes in peers)

1. **Prerendering / SSG + ISR** — no `prerender` route export; the build is
   always server-targeted. Every peer framework has a static mode.
2. **Server-side data caching + revalidation** — no `cache()`/`revalidate()`
   style API for load functions, no SWR helpers. (`$cache` in `@torpor/view`
   is sync memoization only; `notModified` is fully manual.)
3. **Streaming SSR** — responses are piped at the transport level, but page
   rendering buffers: `$async { source: "server" }` blocks the render up to
   its timeout rather than flushing the `with` branch and streaming content
   in later (no suspense-style out-of-order streaming).

### Medium

4. **Route-scoped middleware** — already a TODO in `src/server/Server.ts:36`;
   right now it is global `use()` or per-folder hooks only.
5. **WebSockets (server-side)** — SSE exists client-side, but no WS endpoint
   support (adapter-node could do this).
6. **SEO helpers** — no sitemap.xml / robots.txt generation, no meta/canonical
   conveniences beyond `@head` merging.
7. **View transitions + scroll restoration** — neither `startViewTransition`
   nor any scroll handling exists in `src/nav/navigate.ts` or
   `src/site/clientEntry.ts`.
8. **i18n / locale routing** — nothing.
9. **Base path config** — `Site` has no `basePath` option (root is always
   `process.cwd()`), so mounting under a subpath is not supported.
10. **Flash messages** — DIY via cookies today; a small helper after
    redirects would round out the actions story.

### Lower / nice-to-have

11. Image optimization / asset pipeline beyond Vite defaults
12. Pagination helpers
13. Rate-limiting primitives (fits naturally as a middleware/plugin)
14. Cron / queues / background jobs (adapter-dependent)
15. Dev toolbar / route inspector

Top three if forced to choose: **prerendering, caching, and streaming SSR** —
those come up in virtually every real project.
