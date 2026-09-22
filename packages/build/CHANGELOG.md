# @torpor/build

## 1.4.4

<sub>2026-09-22</sub>

- _(patch)_ Updated dependency `@torpor/view` v1.1.1

## 1.4.3

<sub>2026-09-18</sub>

- _(patch)_ Fix: form error re-rendering 401 on authenticated pages

## 1.4.2

<sub>2026-09-16</sub>

- _(patch)_
  Fix: `--dev` honors the `PORT` env var

  The dev server always bound port 7059 (auto-incremented by vite when
  busy) -- `process.env.PORT` was only used for the "Connecting to" log
  line, so anything scripting dev servers had to parse the "Listening
  on ..." output to learn the actual port. `runDev` now applies `PORT`
  to the vite server port, matching `--preview`.

- _(patch)_
  Fix: skipped redirects don't fail prerendering

  Prerendering rendered `/_error?status=404` through the root layout
  whenever an `_error` route exists, and on an empty database the
  layout's load redirects to a setup page -- the 303 counted as a
  prerender failure, so a site could never be built before its first
  user existed. Redirect responses are now treated as skips (the page
  isn't shipped, the skip is logged) instead of failures, for both
  prerendered pages and the error page.

- _(patch)_
  Fix: warm the dev server before listening

  The dev server performed its first dependency optimization right
  after printing "Listening on ...", reloading and resetting any
  in-flight connections -- clients saw an empty reply until it
  settled. `runDev` now loads the SSR entry before binding the
  listener, so the first optimization (and the optimizer-driven
  reload) completes before the port is open.

- _(patch)_
  Fix: endpoints can return fetched Responses

  `addHeaders` appended set-cookie/CORS headers directly to the
  response, but the headers of a Response obtained from `fetch()` are
  immutable in undici -- an endpoint relaying a peer's Response (e.g.
  returning the error response from a cross-site fetch) threw an
  unhandled `TypeError: immutable` that killed the whole node process.
  `addHeaders` now catches the TypeError, swaps in a mutable clone of
  the response, and writes the headers to that instead.

## 1.4.1

<sub>2026-09-16</sub>

- _(patch)_
  Fix: package detection for strict exports maps

  `findTorporPackages` skipped packages whose `exports` map has no `.` or
  `./package.json` entry (like `@torpor/ui`): both `require.resolve` calls
  threw `ERR_PACKAGE_PATH_NOT_EXPORTED`, so the package was never excluded
  from dep optimization or added to `ssr.noExternal`. The resolver now falls
  back to the standard node_modules lookup paths, and `@torpor/ui` exports
  its own package.json.

## 1.4.0

<sub>2026-09-16</sub>

- _(minor)_
  Feat: `invokeHook` for calling server hooks in-process

  `@torpor/build/server` now exports `invokeHook(hook, event)`, which runs a
  server hook's `enter` function and returns its `Response` (or undefined),
  so code that invokes endpoints in-process can honor a hook's short-circuit
  response. A hook declared with `satisfies ServerHook<"...">` keeps its
  implementation's inferred return type -- usually `void` -- so calling
  `hook.enter(event)` directly doesn't type the result as `Response | void`;
  `invokeHook` accepts any `ServerHook` and preserves the widened signature.

- _(patch)_
  Fix: load .env when building

  `runBuild` now calls `configDotenv()` at startup, matching `runDev` and
  `runPreview`. Build-time prerendering goes through the full load pipeline
  (including the `_error` page), so route `load` functions can hit the
  database or otherwise depend on environment variables from `.env` files.

- _(patch)_
  Fix: view transitions are opt-in

  Client navigations no longer run inside `document.startViewTransition` by
  default, so pages no longer cross-fade when navigating. Set
  `site.viewTransitions = true` in site.config.ts to opt in; pages then
  cross-fade and can be animated with `::view-transition-old/new` CSS. The
  initial hydration still skips the transition, and scroll restoration is
  unaffected.

- _(patch)_
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

## 1.3.0

<sub>2026-09-14</sub>

- _(minor)_
  `readForm` can now read submitted files: use the `File` class as the spec's default to
  get a single file (missing when no file was selected), or `[File]` to get every
  submitted file as an array. Previously File values were stringified, so multipart
  submissions could not be handled. Actions with a schema could already receive files --
  `File` values pass through validation untouched -- and `+server.ts` endpoints read
  multipart bodies natively via `request.formData()`.
- _(minor)_
  New `env()` in `@torpor/build/env` returns the server environment -- `process.env` on
  Node (with `.env` files loaded by the CLI) and the platform environment, with bindings,
  on Cloudflare. Its type comes from the `TorporEnv` global interface, declared in three
  layers: `@torpor/build` reserves framework keys (`TORPOR_SESSION_SECRET`), adapters add
  their platform's keys (the Cloudflare adapter declares `ASSETS`), and apps merge their
  own in an ambient `src/env.d.ts`. For runtime checking, set a Standard Schema on
  `site.env` in site.config.ts -- `env()` then validates on first use per request and
  throws with the schema's issues, so a missing or invalid key fails immediately instead
  of passing `undefined` along.
- _(minor)_
  Server events now have a `session` helper for reading and writing a signed cookie, in
  load functions, actions, `+server.ts` endpoints and hooks. The value is signed with
  HMAC-SHA256 (Web Crypto, so it works on Node and Cloudflare) using the
  `TORPOR_SESSION_SECRET` environment key. The API is deliberately low-level and
  storage-free: `get` verifies the signature and expiry and returns the data, `set`
  writes it (keeping the session id stable), `regenerate` writes with a fresh id for
  login and privilege changes, and `destroy` deletes the cookie. The stable `id` doubles
  as a database key for apps that need revocation: store it server-side, check it on each
  authed request, and delete the row to revoke. Session data must be JSON-safe and fit
  in a cookie (~4KB); the default expiry is 30 days (`{ maxAge }` to change).
- _(minor)_
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

- _(minor)_
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

- _(minor)_
  Feat: view transitions and scroll restoration

  Client navigations now run inside `document.startViewTransition` (where the
  browser supports it), so pages cross-fade by default and can be animated
  with `::view-transition-old/new` CSS. The initial hydration skips the
  transition. Scroll position is reset when moving to a different page, kept
  for same-page navigations (query changes, form action re-renders), and
  restored on back/forward from the scroll saved into the history entry.

- _(minor)_
  Feat: flash messages

  Actions can set a one-time values store that survives a redirect:
  `event.flash.set("Project saved")` (stored as `{ message }`), or any
  JSON-safe object (`event.flash.set({ error: "Import failed" })`). The
  values ride in a session-lifetime cookie that is deleted when it is read,
  so the redirected page shows them exactly once -- the render pipeline
  consumes them into `$page.flash`, the same pattern as `$page.form`. No
  signing: flash values are plain values to render as text, no secret is
  needed, and reads/writes stay synchronous. Without cookies the action
  still completes -- the banner is simply skipped.

- _(minor)_
  Feat: SEO helpers

  `seo()` in `@torpor/build/discovery` builds a page's head from its values: a
  title, a description and (when an image or url is included) Open Graph /
  Twitter metas. Endpoint `head` data is now rendered at render time
  (escaped, with layouts losing to the page and everything losing to the
  first title in the compiled `@head` markup), which also activates the
  previously-unused head property. For sitemaps, `site.sitemap = true` (or a
  custom path) writes a build-time `sitemap.xml` listing the prerendered
  pages, requiring `site.origin` for the urls. robots.txt stays a plain
  static file on the host.

- _(minor)_
  Feat: public dir for static host files

  Files in `src/public` are served by the dev server and copied verbatim
  into the client build output root, so root-level host files (robots.txt,
  favicon.ico, .well-known/*, ads.txt and friends) get deployed without
  routing or extra configuration. A prerendered site's `dist/client` runs
  them straight onto the host, so `robots.txt` can point at the sitemap.

- _(minor)_
  Feat: runtime sitemap endpoints

  `site.sitemap` accepts a runtime config alongside the build-time boolean:
  `sitemap = { get: async (event) => ["/posts/a", "/posts/b"] }` serves the
  XML live on each request, reading the database (typically), so sitemaps
  can keep up with content that isn't prerendered (blog posts under
  `[slug]`, for example). The urls returned are base-free paths and the
  site origin is added. The path defaults to `/sitemap.xml` and `origin`
  can override `site.origin` for the file.

- _(minor)_
  Feat: route middleware

  `site.middleware` sets global middleware, run for every request before
  routing -- including requests that won't match a route, so maintenance
  mode, legacy url redirects and custom error handling are expressible.
  Server endpoints (`+page.server.ts`, `+server.ts`) take
  `middleware: [...]` for route-scoped guards, which run after the global
  middleware and before folder hooks, so a guard can skip data loading
  entirely. Both use the same shape: `enter` runs in order and may return a
  Response to short-circuit; `exit` runs in reverse and can inspect `ev.error`.
  Middleware see the raw request url. The existing low-level `Server.use()`
  is unchanged and stays internal -- packages can push middleware onto
  `site.middleware` from a site plugin, which is how shippable cross-cutting
  features (rate limiting, auth) should attach.

## 1.2.0

<sub>2026-09-10</sub>

- _(minor)_
  Feat: opt-in server-side fetching for async data

  `$async` getters can now fetch during the server render with
  `{ source: "server" }`: the `@await` boundary ships its content resolved
  (with values embedded for hydration -- no fallback flash, and dependency
  changes still re-fetch on the client), and degrades to the `with` branch +
  client fetch on a timeout (`timeout`, default 5000ms), a rejection, or a
  client-fetch getter inside the boundary. Streaming delivery may be added
  later without the option changing.

  To support this, compiled server components are now `async` functions
  returning `Promise<{ body, head }>`, and `ServerComponent` /
  `ServerSlotRender` are typed accordingly -- call sites (including
  `loadView`) await the result, which also accepts the old plain-object
  shape. Most of the work is detailed in `packages/view/ASYNC.md`.

  Also: the test harness now maps every runtime helper import to source, so
  view tests no longer silently run a stale built package.

## 1.1.0

<sub>2026-09-09</sub>

- _(minor)_
  Feat: when a site doesn't set an adapter, one is resolved automatically at
  build/preview time -- a deployment environment (e.g. `CF_PAGES` for
  Cloudflare Pages) picks the platform's adapter when installed, an installed
  `@torpor/adapter-*` package is used otherwise (preferring node), and as a
  last resort preview serves the built output on the current runtime (Bun or
  Deno natively; node needs `@torpor/adapter-node`). The chosen adapter is
  logged, and `serve` may now be async.
- _(patch)_ Fix: build head element in SSR
- _(patch)_
  Fix: a form re-render no longer fails the load query validation when the
  action url drops query params (form errors render instead of an error
  redirect), and the action name is read from the `?/name` query key so forms
  work on urls that already carry a query string. Also fixed: a `+server`
  route's server hook can short-circuit the request again (an enter response
  was being ignored), and the test harness now runs the same request handlers
  as the site server.

## 1.0.2

<sub>2026-09-08</sub>

- _(patch)_
  Fix: replace the `development` export condition with a custom `torpor:source`
  condition. Vite's dev server activates `development` by default, so registry
  installs resolved `@torpor/view` (and `@torpor/view/dev`) to the unpublished
  `src/` files and failed with "Failed to resolve import ... Does the file
  exist?" errors in `tb --dev`. The custom condition is only activated when the
  framework is linked into the app (source mode), so published installs now
  always resolve the compiled `dist` files.

## 1.0.1

<sub>2026-09-08</sub>

- _(patch)_
  Fix: the site entry files (clientEntry, clientEntryDev, serverEntry) and the dev
  runtime are now compiled into dist, and registry installs run them instead of
  raw sources — previously `tb` loaded `.ts` files from the installed package's
  src folder, which broke consumer apps with "Failed to resolve import" errors
  when src wasn't shipped. Source mode (running framework `.ts` directly, so
  changes take effect without a rebuild) is now opt-in: it activates when
  `@torpor/build` and `@torpor/view` are both symlinked into the app from
  outside node_modules, or when the `TORPOR_SOURCE_DEV` env var is set. The
  `@torpor/build/dev` export gained a compiled `dist/dev.mjs` target alongside
  its source condition.
- _(patch)_ Fix: tidy up the template and created sites

## 1.0.0

<sub>2026-09-03</sub>

- _(major)_ Version 1 is here!
- _(minor)_
  - OpenAPI generation via the CLI or at runtime
  - New mini build mode with server code generation
  - Nested hooks (like layouts); middleware/hooks `next()` renamed to `enter()`/`exit()`
  - Adapters now integrate as Vite plugins
  - Support for downloading files on form submit; standardized HTTP header casing
  - Fixes: stale dependency cache on dev startup, manifest `load` export detection, `pathToRegex` splat params
- _(minor)_ Moved from a regex router to a trie router
- _(patch)_ Edit: standardize HTTP header case
- _(patch)_ Feat: allow downloading files on form submit

## 0.4.14

### Patch Changes

- cc911b1: Fix: posting directly to a server endpoint action

## 0.4.13

### Patch Changes

- 91de86b: Fix: posting directly to a server endpoint action

## 0.4.12

### Patch Changes

- 5d85de7: Fix: make symbols prefixed
- Updated dependencies [1eb56a9]
- Updated dependencies [31b1261]
- Updated dependencies [2be9d75]
- Updated dependencies [efc50a3]
  - @torpor/view@0.4.18

## 0.4.11

### Patch Changes

- aa148ad: Chore: also publish files in the src folder

## 0.4.10

### Patch Changes

- 802cb4c: Chore: only publish files in the dist folder
- Updated dependencies [802cb4c]
  - @torpor/view@0.4.16

## 0.4.9

### Patch Changes

- 2e057c3: Fix: form and button actions

## 0.4.8

### Patch Changes

- d813c86: Fix: pass search params to client side data cache

## 0.4.7

### Patch Changes

- a09c14e: Fix: bad bin script

## 0.4.6

### Patch Changes

- cf8d8db: Fix: pass search params to client side navigation
- 64adf0b: Feat: `subFolder` option when adding routes
- Updated dependencies [9bca98e]
- Updated dependencies [7382b6d]
- Updated dependencies [d68d347]
- Updated dependencies [4e3d726]
- Updated dependencies [adfa504]
  - @torpor/view@0.4.14

## 0.4.5

### Patch Changes

- ec90aef: Fix: submit to a button's formaction if set

## 0.4.4

### Patch Changes

- 5b12119: Fix: don't add error JSON as the message
- Updated dependencies [3cc2168]
- Updated dependencies [13f2afb]
  - @torpor/view@0.4.7

## 0.4.3

### Patch Changes

- 426f7bd: Fix: return default $page.form status and message

## 0.4.2

### Patch Changes

- 5dd6a23: Fix: only set $page.form if the result is JSON

## 0.4.1

### Patch Changes

- 5972cf8: Fix: ensure that $page and client are always in scope
- Updated dependencies [00a1868]
  - @torpor/view@0.4.3

## 0.4.0

### Minor Changes

- 168dff3: !Edit: rename Range to Region to avoid name conflicts

### Patch Changes

- 051998b: Feat: very rudimentary dev tools
- Updated dependencies [255aad3]
- Updated dependencies [8b377a2]
- Updated dependencies [450b739]
- Updated dependencies [168dff3]
- Updated dependencies [fc60fe0]
- Updated dependencies [42c6b60]
- Updated dependencies [2818679]
- Updated dependencies [38fd0a5]
- Updated dependencies [3e6f3f7]
- Updated dependencies [051998b]
  - @torpor/view@0.4.0
  - @torpor/unplugin@0.2.1

## 0.3.1

### Patch Changes

- 34d17f7: Feat: UI Form component and client-side submit
- Updated dependencies [f4716c5]
- Updated dependencies [1253f7a]
- Updated dependencies [6268e00]
- Updated dependencies [f2fb547]
  - @torpor/view@0.3.2

## 0.3.0

### Minor Changes

- 51dbba7: Chore: drop CJS build and go ESM only
- 62b0d2e: !Edit: renamed responses and updated documentation

### Patch Changes

- bbdc8d3: Feat: return form errors from the server
- e1ae2bb: Feat: load and reload methods for navigation
- Updated dependencies [be98b35]
- Updated dependencies [51dbba7]
- Updated dependencies [2298a87]
- Updated dependencies [3a8431a]
- Updated dependencies [eb58d37]
- Updated dependencies [e0637be]
- Updated dependencies [9fcc613]
- Updated dependencies [f5f84e6]
- Updated dependencies [6cc57ff]
- Updated dependencies [c4f9d18]
- Updated dependencies [5598bc9]
- Updated dependencies [18f1ccf]
- Updated dependencies [c2b5c02]
- Updated dependencies [91d1536]
- Updated dependencies [4dc16df]
- Updated dependencies [543b229]
- Updated dependencies [3cf3ae6]
  - @torpor/view@0.3.0
  - @torpor/unplugin@0.2.0

## 0.2.0

### Minor Changes

- b716d5c: Feat: inline styles during SSR

### Patch Changes

- a4f2573: Fix: reload the page on successful form submit
- 67e6ca6: Fix: don't intercept external links
- Updated dependencies [c38f914]
- Updated dependencies [995d950]
- Updated dependencies [b716d5c]
- Updated dependencies [014bda0]
  - @torpor/view@0.2.0
  - @torpor/unplugin@0.1.17

## 0.1.34

### Patch Changes

- 1221923: Fix: updating layouts in [parameter] routes
- Updated dependencies [741a289]
  - @torpor/view@0.1.11

## 0.1.33

### Patch Changes

- 74bf42d: Fix: store (and clear) the right layout slot ranges
- Updated dependencies [74bf42d]
  - @torpor/view@0.1.10

## 0.1.32

### Patch Changes

- 951a86f: Feat: re-use layout data and UI
- 182d436: Feat: prefetching link data
- Updated dependencies [1866f30]
- Updated dependencies [a31647f]
- Updated dependencies [951a86f]
- Updated dependencies [6d6fb89]
- Updated dependencies [9c13f0f]
  - @torpor/view@0.1.6

## 0.1.31

### Patch Changes

- Updated dependencies [f390b78]
  - @torpor/view@0.1.5
  - @torpor/unplugin@0.1.16

## 0.1.30

### Patch Changes

- Updated dependencies [daba2ad]
  - @torpor/view@0.1.4
  - @torpor/unplugin@0.1.15

## 0.1.29

### Patch Changes

- Updated dependencies [de51225]
  - @torpor/view@0.1.3
  - @torpor/unplugin@0.1.14

## 0.1.28

### Patch Changes

- fa85b57: Fix: force `.torp` file compilation in dev

## 0.1.27

### Patch Changes

- bed55d5: Feat: allow passing Vite options in dev

## 0.1.26

### Patch Changes

- 348cd75: Feat: allow creating the Site router with files
- Updated dependencies [0e69292]
- Updated dependencies [b69fde1]
  - @torpor/view@0.1.2
  - @torpor/unplugin@0.1.13

## 0.1.25

### Patch Changes

- 3fe0d0e: Feat: set default error messages in responses
- f26603f: Feat: basic error handling
- Updated dependencies [f9fd76d]
- Updated dependencies [1ddc240]
- Updated dependencies [7b9dc31]
  - @torpor/view@0.1.1
  - @torpor/unplugin@0.1.12

## 0.1.24

### Patch Changes

- 6092a91: Fix: don't swallow error responses when loading data

## 0.1.23

### Patch Changes

- 22f62d4: Fix: Site.viteConfig settings

## 0.1.22

### Patch Changes

- 4e0ec90: Feat: allow more Site.viteConfig settings

## 0.1.21

### Patch Changes

- 4296742: Feat: add Site.viteConfig to set Vite options in build

## 0.1.20

### Patch Changes

- a61f30f: Debug: double hydration
- Updated dependencies [28a993b]
- Updated dependencies [98602ec]
- Updated dependencies [a49d307]
- Updated dependencies [995513a]
- Updated dependencies [c9a9cf8]
- Updated dependencies [cbd07ca]
- Updated dependencies [f53b184]
- Updated dependencies [215db17]
- Updated dependencies [95e866b]
  - @torpor/unplugin@0.1.11
  - @torpor/view@0.1.0

## 0.1.19

### Patch Changes

- 170c886: Debug: double hydration

## 0.1.18

### Patch Changes

- Updated dependencies [fb896c6]
- Updated dependencies [85bccf6]
  - @torpor/view@0.0.14
  - @torpor/unplugin@0.1.10

## 0.1.17

### Patch Changes

- 7373f27: Fix: parse the cookie value retrieved from the map
- 679a448: Fix: set $page props on every navigation
- e5b761b: Feat: allow passing ServerEvent to runTest
- Updated dependencies [ed4a6db]
  - @torpor/view@0.0.13
  - @torpor/unplugin@0.1.9

## 0.1.16

### Patch Changes

- 9332635: Fix: set $page props in the correct object
- Updated dependencies [ff5f459]
  - @torpor/view@0.0.12
  - @torpor/unplugin@0.1.8

## 0.1.15

### Patch Changes

- Updated dependencies [e4060e6]
  - @torpor/unplugin@0.1.7

## 0.1.14

### Patch Changes

- e395c9e: Feat: rudimentary test infrastructure
- Updated dependencies [5676a0b]
  - @torpor/unplugin@0.1.6

## 0.1.13

### Patch Changes

- 02eac8e: Feat: allow passing extra inputs to build

## 0.1.12

### Patch Changes

- 8de094b: Fix: ignore trailing slashes when matching routes

## 0.1.11

### Patch Changes

- 858538b: Fix: move adapter to globalThis, pass it to server loads

## 0.1.10

### Patch Changes

- Updated dependencies [78e78b9]
  - @torpor/view@0.0.11
  - @torpor/unplugin@0.1.5

## 0.1.9

### Patch Changes

- ff685cb: Fix: use the existing fragment name

## 0.1.8

### Patch Changes

- fe7444e: Refactor: rearrange build exports
- Updated dependencies [8852c89]
  - @torpor/unplugin@0.1.4

## 0.1.7

### Patch Changes

- Updated dependencies [3cf6de6]
  - @torpor/view@0.0.10
  - @torpor/unplugin@0.1.3

## 0.1.6

### Patch Changes

- 47c5277: Chore: update dependencies
- Updated dependencies [47c5277]
  - @torpor/unplugin@0.1.2
  - @torpor/view@0.0.9

## 0.1.5

### Patch Changes

- 5c9d90f: Fix: double check server rendering from Vite options
- Updated dependencies [a8ead36]
  - @torpor/view@0.0.8
  - @torpor/unplugin@0.1.1

## 0.1.4

### Patch Changes

- 20ddf6c: Fix: better/less console.logging

## 0.1.3

### Patch Changes

- 4b86717: Refactor: separate adapters into packages

## 0.1.2

### Patch Changes

- d31d14d: Feat: allow running from code

## 0.1.1

### Patch Changes

- Updated dependencies
  - @torpor/unplugin@0.1.0

## 0.1.0

### Minor Changes

- Chore: replace Vinxi with Vite plugins

## 0.0.6

### Patch Changes

- Updated dependencies [b90d729]
  - @torpor/view@0.0.7
  - @torpor/unplugin@0.0.6

## 0.0.5

### Patch Changes

- 79da6cf: Refactor: export more types
- 3707fdb: Fix: better ordering of routes
- Updated dependencies [808da4c]
  - @torpor/view@0.0.6
  - @torpor/unplugin@0.0.5

## 0.0.4

### Patch Changes

- Updated dependencies [44cf656]
- Updated dependencies [a278176]
  - @torpor/view@0.0.5
  - @torpor/unplugin@0.0.4

## 0.0.3

### Patch Changes

- Updated dependencies [76dd6ea]
- Updated dependencies [8f0a0a1]
  - @torpor/view@0.0.4
  - @torpor/unplugin@0.0.3

## 0.0.2

### Patch Changes

- Fix: use /~server for hooks as well as layouts
- Fix: catch-all routes should get checked last
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
  - @torpor/view@0.0.3
  - @torpor/unplugin@0.0.2
