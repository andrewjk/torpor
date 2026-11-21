# Follow-ups

Items that were noticed and deliberately left out of scope of a previous change.
Each entry should describe what was seen, where, and any relevant context.

## Bugs

### Loop-var resolution in @for bodies: open points

The read-only loop-var bindings shipped (`appendForVarBindings` shadows, writes
are compile errors) — what's left, deliberately parked:

- **The error hint is container-agnostic on purpose** ("assign to a property of
  the item, or mutate the source collection directly"): there is no single
  `source[i] = …` form that is correct for every iterable (Map needs `.set`,
  `entries()` destructures an index that isn't the source, `{ name }` isn't
  addressable). If we want per-form hints, the loop header has to be parsed
  more richly.
- **The `@for` header parser** (`forLoopVarsRegex`'s "Handle destructuring,
  quotes, comments etc" TODO) is still heuristic.
- **Code is still generated for an erroring program** (it just assigns a `const`
  at runtime) so the user can inspect output. Emitting nothing — or a
  not-compiled stub — would be a follow-up.

Binding placement is optimised to avoid unused lines. Effect bodies, handlers,
`@function` bodies and `$onmount` bind only the vars their own code reads
(`forVarBindings(status, source)`). The row-create callback binds only the vars
its _directly-evaluated_ code reads — component initial props, `<slot>`/`fill`
prop expressions, `@const`, `&ref`, interpolated `@element` self — via
`compile/utils/forVarsReadDirectlyIn.ts`; nested scopes inside the row bind
their own. The `createNewItems` header binds only the vars its loop
header/`@key` read. `forVarsReadDirectlyIn` is heuristic and deliberately
conservative (an extra binding is harmless, a missing one is a
`ReferenceError`); it must treat fill/slot prop values as live in the row
scope. Control-node callbacks still bind every var in scope, which could be
tightened if it shows up in profiles.

### Client navigation offline: remaining follow-ups

The full-document fallback now only runs when a navigation failed while
online, after the app cancels `torpor:navigation-failed`, or when the target
is a by-design document navigation (a pure `+server` route or a redirect).
Offline, the page is kept and the event fires. Load failures render in place:
a rejected `~server` fetch becomes a `503` and a throwing client `load()` a
`500`, both rendered by the nearest error page, and the error page's own
failing load renders over the live layouts instead of blanking the shell.
`navigate` reports a tagged result (`rendered` / `server-only` / `redirect` /
`failed`) so callers can tell the cases apart; `load` and `reload` keep their
boolean return. A rejected form submission fires `torpor:submit-failed`, keeps
the form as the user left it, and falls back to a native submission when the
app cancels the event.

Deliberately left out:

- **popstate suppression.** A failed popstate still reloads the document. By
  the time popstate fires the URL has already moved, so keeping the page
  needs a history fix (push the entry back, or accept a URL/content
  mismatch) — a separate decision.
- **Eager prefetch.** Apps with lazy route modules and no service worker
  (Vite dev is the common one) still can't render a page whose module was
  never fetched offline. Mallet works around it with a dev-only
  `import.meta.glob("../routes/**/+page.ts")` prefetch; a router option or an
  exported `prefetchRoutes()` (the `data-tb-prefetch="eager"` TODO) would
  make it a supported pattern. Built apps are covered by their service
  worker's precache.
- **A default notice.** With no listener, a suppressed navigation or a failed
  submit is silent apart from the framework's `console.warn`. A built-in
  notice, or a `client.navigationFailed` hook alongside the events, was
  considered; neither shipped.

### Standard schema validation: remaining integration points

Endpoints now support standard schemas for request bodies (`json()`), form
data (`form()`), query strings (`query()` for get/head handlers and load
functions) and route params (the reserved `params` schema key). Surfaces
deliberately left out:

- **Server hook schemas** (`ServerHook.enter`): a hook could declare
  body/query schemas for cross-cutting validation (auth tokens, session
  cookies). The `validate()` helper from `@torpor/build/schema` covers this
  manually for now.
- **Client load functions** (`+page.ts` / `PageLoadEvent`): query validation
  for client loads. These run in the browser, so the schema would be included
  in the client bundle; needs a bundle-cost tradeoff decision.
- **Response validation**: validating what handlers return (Fastify-style
  output schemas). Runtime cost on every response; bigger feature. Now also
  the natural feed for OpenAPI response schemas (see the OpenAPI section
  below) -- designing the two together is the plan.
- **Client-side pre-submit validation** (`nav/formSubmit.ts`): validate form
  data in the browser before POSTing for instant feedback. Requires shipping
  schemas to the client and a shared error shape into `$page.form`.
- **makeApi query typing**: `makeApi` callers get their body param from the
  endpoint's json schema, but GET callers can't pass a validated/typed query
  object; the query string must still be appended to the URL manually.
- **Layout endpoint schemas**: schemas declared on `_layout.server` endpoints
  are not applied to the layout's own load/actions; the page's server
  endpoint schema is the one used for shared params/query validation during
  SSR.

### OpenAPI generation: known gaps

The `openApi()` site plugin (`@torpor/build/openapi`) generates an OpenAPI
3.1 document from `+server` routes, served at `/openapi.json` with a Swagger
UI page at `/docs`, plus a `tb --openapi` CLI command. Deliberately left out:

- **Response schemas**: every operation documents a stub `200` (plus `422`
  when the handler declares an input schema). Real response schemas want the
  response-validation feature first (see above) so both share one schema
  shape.
- **No `$ref`/`components` dedup**: converter output is inlined verbatim,
  including any `$defs` the converter emits. Valid OpenAPI 3.1, but
  documents with repeated schemas are larger than they could be.
- **Non-object query/params schemas are ignored**: if a `get`/`params`
  schema converts to something without `properties`, no parameters are
  documented (best-effort mapping).
- **Page-server routes, hooks and layouts aren't documented**: `?/action`
  POST semantics don't map cleanly to OpenAPI operations. Only `+server`
  routes (type 3) are included.
- **The docs page loads Swagger UI from unpkg**: no offline/bundled UI
  option; a Scalar/self-hosted alternative could be added later.

### DataGrid: known gaps from the first version

Built with static `data` or a network `load` function (the shared loader shape
lives in `src/ui/utils/loader.ts`, ready to port to ComboBox etc.). Left out
deliberately:

- No PageUp/PageDown keyboard navigation (APG grid suggests it when rows
  paginate); arrows/Home/End/Ctrl+Home/Ctrl+End only.
- No selection model (row or cell), so no `aria-selected`; APG's
  "optional interactive" behaviors (editable cells, checkboxes) are unhandled.
- No virtualization -- every row of the current page renders. Fine for paged
  grids; a virtual-scroll variant will want windowed rendering plus
  `aria-rowcount`/-rowindex handling.
- Columns are read once at setup (adding a column later won't re-render
  headers). Rows are fully reactive; columns assumed static.
- Sorting a loader-backed grid refetches with `sortBy`/`sortDirection` in the
  request (and superseded requests are aborted via the loader's `AbortSignal`);
  there is still no optimistic local sort.
- `aria-rowcount` is set from the loader's `total` when provided; not wired to
  `aria-rowindex` on rows.

### Loader adoption in ComboBox/SelectBox: known gaps

ComboBox and SelectBox accept the shared `load` prop (utils/loader.ts
`createItemLoader`) and auto-render a ListBox of loaded options when no
content is slotted in. Left out deliberately:

- Stale-response ordering relies on `$async`'s generation guard; loaders also
  receive an `AbortSignal` now (superseded requests are aborted, and their
  rejections swallowed), so well-behaved loaders can cancel the wire request.
- SelectBox loads once per mount (content stays mounted but hidden), not once
  per open; a refresh-on-reopen option may be wanted.

### Language server duplicates @torpor/check's compile-and-check pipeline

Found while modernizing the VS Code extension (now packages/vscode): the LSP server is now a standalone
workspace package (packages/language-server, with a `torpor-lsp` bin that
defaults to stdio), but it still carries its own copy of the same pipeline as
@torpor/check (packages/check/src/) -- transformDocument (compile a .torp
into TS via @torpor/view, rewrite imports of .torp components into virtual
.ts files), loadDocument (set up the @typescript/vfs environment from the
project's tsconfig), and error mapping back to source ranges. They will
drift. Worth extracting a shared package (e.g. @torpor/analyze) that both the
CLI check and the language server use.

### TypeScript 7 (native) is not yet supported by the language server

The language server prefers the project's own TypeScript for the language
service (Volar-style, with a fallback to the version bundled with
@torpor/language-server), but TypeScript 7's native package does not expose
the compiler enums (ScriptTarget, ModuleKind, ...) or the same service
internals, so the loader's compatibility check falls back to the bundled
version for TS 7 projects. When @typescript/vfs and the service calls are
updated for the native API, the guard in
packages/language-server/src/script/typescriptLoader.ts can be lifted.
Related: the vfs is pointed at the loaded TypeScript's lib folder explicitly
(`ts.sys.getExecutingFilePath()`), because @typescript/vfs's default
resolution relies on require(), which doesn't exist in ES modules.

### Zed support needs an extension package plus a tree-sitter grammar

Zed can't consume a language server generically -- it needs an extension
(extension.toml + a small Rust shim) that registers the language, and Zed
wants a tree-sitter grammar for syntax highlighting (the TextMate grammar in
@torpor/textmate can't be used there). Until a tree-sitter-torpor grammar
exists, the extension can only provide partial support. The language-server
README documents setups for editors that work today (Neovim, Helix,
OpenCode).

### Prebundling .torp libraries: compile into the dep optimizer

Done already: `@torpor/build` detects installed packages that ship `.torp`
files (a `torpor` field or `.torp` export targets in their package.json) and
automatically adds them to `optimizeDeps.exclude` and `ssr.noExternal`
(packages/build/src/utils/torporPackages.ts). The remaining performance
follow-up, like Svelte's `prebundleSvelteLibraries`: registering an optimizer
plugin so `.torp` files can actually be _compiled into_ the dep optimizer's
bundle, instead of being excluded and transformed per-request in dev (fine
for icon packages, but it's an extra transform per module load).

### `$stream` follow-ups

`$stream(source, handler, options?)` shipped in `@torpor/view` (managed
external-event subscriptions: mount/unmount lifecycle, dep-tracked
resubscribe, SSR-safe). Deliberately left out:

- **`$run(fn, { debounce })`**: debounced _state-triggered_ effects
  (autosave-on-type). The `$run.ts` TODO covers it; scheduling debounced
  re-runs needs a scheduler-level hook in `triggerEffects`, not a closure
  trick, so it's a separate change. Workaround today: `$run` + timer
  cleanup.
- **More timing options** (`throttle`, count gates) and stream combinators:
  intentionally omitted. The `StreamSource<T>` type makes them plain
  userland functions (`everyN(3, src)` composes by wrapping), so the
  framework ships zero of them until real usage demands it.
- **Error channel**: a `StreamSource` has no `fail` callback. Current rule
  (documented in JSDoc): errors are values; sources own their reconnection.
  Revisit if wrapper sources (retry/backoff wrappers) become common.

### Interactive components in markdown (MDX-lite)

The site's markdown pipeline (`site/src/lib/markdown`) renders content to
static HTML; there's no way for a post to embed live Torpor components. Sketch
for when it's actually needed: allmark's extensibility hooks (custom block
rules + renderers) could add a `:::carousel` style fence rule whose renderer
emits a placeholder like `<div data-torpor="Carousel"
data-props='{...}'></div>`, and `PostPage.torp` would use `$onmount` to find
placeholders and swap in real components client-side (`$watch`-wrapped props
from the parsed JSON). Interacts with the pipeline's sanitization (now wired
in via allmark's `sanitize`): the `data-torpor`/`data-props` attributes would
need allowlisting, or (better) placeholders are injected _after_ sanitization
so component props never run through the tag filter.

### Custom renderers for docs pages

The docs section (`site/src/views/docs/*.torp`) is hand-written components;
the markdown pipeline only backs the blog. allmark's renderer system could
add a fenced-code renderer that emits the site's `CodePreview` markup
(shiki-highlighted via `@torpor/shiki`, copy button), so
`site/src/content/docs/*.md` files could eventually replace the hand-written
docs pages while keeping the same look. Also needs heading-anchor generation
and a TOC (frontmatter `title` ordering exists for blog posts; docs would
want collection-level nav from the file tree, like `DOC_LINKS` in
`site/src/utils/nav.ts` provides today).

### Template markup is shipped twice: JS bundle and SSR HTML (resumability experiment parked)

Static markup in a `.torp` template is emitted into the client JS as the
`t_fragment`/`t_fragment_el` template-literal strings
(`packages/view/src/compile/build/client/buildFragmentText.ts`) _and_ into the
SSR HTML. For an `@if`/`@switch`, the JS carries every branch while the HTML
carries the one that rendered (e.g.
`packages/view/test/if/components/output/IfElseTrue-client.ts:40,52` vs
`...-server.ts:12-19`), and during hydration the DOM already has the nodes yet
`t_fragment` still builds the template via `innerHTML` (`getFragment.ts`'s
"if we're hydrating we probably don't want to create and return a fragment"
TODO).

Measured on the site's production build (home route, 2026-10): first-load JS
was 281,880 B raw / 93,274 B gzip over 26 files; ~20,620 B of that was markup
templates (7%), but only ~905 B gzip was markup that _actually appears_ in the
HTML. The layout chunk is 57% markup yet only ~20% of it rendered on `/` (the
rest is untaken branches). Aggregate over all 123 client chunks was 507 KB of
markup templates (30.8%), dominated by lazy chunks (the REPL playground, the
full UI-library bundle), not first paint.

So the duplication is real but small here, because the site's content is
markdown-as-data — inline static prose would be the worst case, not the best.
The dominant first-load cost was unrelated: `CodePreview`/shiki (165 KB raw /
54 KB gzip, 58% of first-load gzip) statically imported by `HomePage.torp` for a
sample the server already highlights, addressed separately (next entry).

Idea for later, if a content-heavy static page ever appears: ship only the HTML
and resume from it (Qwik-style), so static markup is never in the JS — the JS
would fetch markup only when it must re-render a branch that wasn't
server-rendered. Requires a hydration path that never builds the `t_fragment`
templates, plus a markup transport. A substantial redesign; not worth it for
the numbers above. The ambiguous variant ("mine rendered text back into
state") is a non-starter — `t_fmt` interpolation isn't invertible (multiple
placeholders per node, HTML escaping, merged text nodes, no type info), and
data used only in attributes/conditions never appears as text.

### `source: "server"` embeds resolved values in the HTML, duplicating large payloads

A resolved `source: "server"` boundary ships its value twice: once as the
rendered markup, and again as JSON in the `<!--t-await:[...]-->` payload
comment (`payloadComment` in `packages/view/src/ssr/runServerAwait.ts`). The
payload is what lets `$async` seed its computeds on hydration without
re-fetching, so it can't just be dropped — but when a value's rendered form is
the value itself (an `@html(...)` result, e.g. `CodePreview.torp`'s highlighted
HTML), the two copies are near-identical and the comment roughly doubles that
content's HTML cost (the home page's HTML grew ~0.58 KB gzip when the code
sample started shipping server-highlighted, most of it the duplicated payload).

Not worth changing while the values are small. If a boundary ever ships a large
JSON value that also renders verbatim, possible directions: reconstruct the
value from the adopted DOM instead of embedding it (only works when the
rendering is lossless), or embed a compact reference into a per-boundary map.

### Embedded server data is part of the (cacheable) HTML

`loadView` embeds each route's _full_ server-load result as a `t-server-data`
script, not just the subset the template rendered, so a cache that keys a page
by URL alone can expose values the markup never showed. A dev-only reminder
prompts for an explicit `Cache-Control` (and any value silences it), but that's
a nudge, not enforcement — the requirement is on the site's cache config.

### Component props get a redundant re-apply `$run` for statically-constant expressions

`buildComponentNode` (client) emits `$watch({...})` plus a
`$run(() => { t_props["x"] = expr })` whenever the parser flagged the
attribute reactive — and `isReactive` (compile/utils/isReactive.ts) is just a
brace check, so any object/array literal (e.g. `class={{ "child-class": true }}`)
counts as reactive and gets the effect + a duplicate of the literal, even when
the expression contains nothing reactive and the effect can never re-run
(see `test/class/components/output/Class-client.ts` `t_props_2`). Fixing it
wants real static analysis (the "TODO: Need to be more fancy" in isReactive:
matching braces, skipping strings/comments) to avoid silently changing
reactivity. Same heuristic gap drives `as const` on static string props.
