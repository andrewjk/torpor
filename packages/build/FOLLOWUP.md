# Follow-ups

## Missing framework features

A gap analysis of `packages/build` against commonly needed features in peer
meta-frameworks (Next, Nuxt, SvelteKit, Astro, TanStack Start, Hono).
What already exists: file + code routing, layouts, `_error` pages, per-folder
hooks, global middleware (`Server.use()`), cookies (`CookieHelper`), form
actions with Standard Schema validation, client-side navigation with
hover/focus prefetch, SSE client helper (`$stream(fromServer(...))`), OpenAPI
generation + docs UI, test utilities, node/cloudflare adapters with
auto-detection, and ETag/Cache-Control support via `notModified`.

### High impact (table stakes in peers)

1. **Prerendering / SSG + ISR** — no `prerender` route export; the build is
   always server-targeted. Every peer framework has a static mode.
2. **Server-side data caching + revalidation** — no `cache()`/`revalidate()`
   style API for load functions, no SWR helpers. (`$cache` in `@torpor/view`
   is sync memoization only; `notModified` is fully manual.)
3. **File uploads** — `src/form/readForm.ts:52` does `v.toString()` on every
   value, so `File`s become `"[object File]"`. Multipart handling in actions
   and endpoints is effectively absent. This is a correctness gap rather than
   a missing convenience.
4. **Sessions / auth primitives** — no session API at all (cookies are the
   only building block). Even a minimal signed-cookie session helper would
   cover a lot.
5. **Streaming SSR** — responses are piped at the transport level, but page
   rendering buffers: `$async { source: "server" }` blocks the render up to
   its timeout rather than flushing the `with` branch and streaming content
   in later (no suspense-style out-of-order streaming).
6. **Env/secrets API** — there is a `globalThis.adapter.env` convention
   (`src/run/devPlugin.ts:98`), but no unified typed accessor or documented
   dev/prod parity story.

### Medium

7. **Route-scoped middleware** — already a TODO in `src/server/Server.ts:36`;
   right now it is global `use()` or per-folder hooks only.
8. **WebSockets (server-side)** — SSE exists client-side, but no WS endpoint
   support (adapter-node could do this).
9. **SEO helpers** — no sitemap.xml / robots.txt generation, no meta/canonical
   conveniences beyond `@head` merging.
10. **View transitions + scroll restoration** — neither `startViewTransition`
    nor any scroll handling exists in `src/nav/navigate.ts` or
    `src/site/clientEntry.ts`.
11. **i18n / locale routing** — nothing.
12. **Base path config** — `Site` has no `basePath` option (root is always
    `process.cwd()`), so mounting under a subpath is not supported.
13. **Flash messages** — DIY via cookies today; a small helper after
    redirects would round out the actions story.

### Lower / nice-to-have

14. Image optimization / asset pipeline beyond Vite defaults
15. Pagination helpers
16. Rate-limiting primitives (fits naturally as a middleware/plugin)
17. Cron / queues / background jobs (adapter-dependent)
18. Dev toolbar / route inspector

Top three if forced to choose: **prerendering, uploads, and sessions** —
those come up in virtually every real project.
