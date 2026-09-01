# Follow-ups

Items that were noticed and deliberately left out of scope of a previous change.
Each entry should describe what was seen, where, and any relevant context.

## Bugs

### Layouts that never render their `<slot />` fail silently, then throw a cryptic error on client nav

The layout engine (serverEntry.ts, nav/navigate.ts) composes nested layouts by
passing each layout component as the default slot of its parent, so every
`_layout` component must render `<slot />`. Nothing enforces or warns about
this: when a layout wraps its content in another component (e.g. a shared
`SectionLayout`) and forgets to pass `<slot />` down, SSR renders the header
and sidebar fine with an empty content area (no error), and the first
client-side navigation into the section throws
`TypeError: can't access property "startNode", slotRegion is null` from
navigate.ts's reuse path (the page slot function never ran, so the layout
stack entry's `slotRegion` was never assigned). Hit while adding per-section
layouts to the docs site (site/src/views/{docs,ui,build}/*Layout.torp).
A dev-mode warning when a layout component's slot render is never invoked
during a render, or a clearer error in the reuse path, would turn this into
an actionable message.

### Form re-render runs load query validation against the POST url (edge case)

When a form is submitted without javascript and the action returns a 4xx,
`runAction` re-renders the view by calling `loadView` with the POST's URL
(query preserved since this change). The load function's query schema is
validated against that query. If the form action URL drops query params the
load schema requires (e.g. a `?page=` param), the re-render fails validation
and redirects to the error page instead of showing the form errors. A
possible fix is skipping/satisfying load query validation during form
re-renders, or rendering from cached load data.

### Preview of built page sites fails at runtime (pre-existing)

`tb --preview` on page-based examples (`examples/demo`, `examples/mini`) returns
`{"code":"ERR_MODULE_NOT_FOUND"}` / `{"code":"ERR_UNKNOWN_FILE_EXTENSION"}` from
`dist/server/serverEntry.js` — its runtime imports (e.g. `.torp` route files)
aren't resolvable by plain Node. Reproduces at HEAD without the endpoints-only
site.html fix. Dev mode (`tb --dev`, which uses `vite.ssrLoadModule`) works fine.

### replaceForVarNames is textual rewriting with known blind spots (view compiler)

Loop-var rewriting in `@for` bodies is a boundary-class regex over raw expression
text, not AST-based. Recently hardened: string/template-literal contents are
skipped; `?` is a boundary so `item?.x` and `a ?? item` rewrite; comments are
skipped (an apostrophe inside a `//` comment used to swallow the rest of the
expression as an unterminated string, which broke TagInput's suggestion
clicks); regex literals are skipped too. The string/template/comment/regex
skipping itself now lives in one shared scanner (`compile/utils/codeScanner.ts`,
with unit tests) used by the parse and build phases. The rewriting approach
still has inherent blind spots:

- **Shadowing**: a nested function's param/`let` with the same name as a loop var
  gets wrongly rewritten -- `.filter(child => child.ok)` inside a `@for` body
  rewrites the arrow param into `t_item_1.data` (broken). Scopes are invisible to
  a text scan; needs an AST pass (e.g. acorn walk renaming resolvable
  `Identifier` nodes) to fix properly.
- **No-space operator styles**: `x=child`, `a+b`, `a&&b` etc. aren't caught --
  the operator characters aren't boundary chars. Usual spaced formatting is fine.
- **Regex-vs-division disambiguation is a lexical heuristic** (previous
  significant token + keyword list), not a real parse -- exotic ASI cases
  (`a = b\n/c/`) could still fool it.

Object-literal keys that share a loop var's name are safe only by accident (no
`:` in the follower class -- adding it would break keys). The same textual
limitation family exists in the `@for` header parsing (`forLoopVarsRegex` has a
"Handle destructuring, quotes, comments etc" TODO) and in `isForBodyNoProxySafe`'s
write detection.

### refocusAnchorOnHide focuses whatever component anchors the content

When popout content hides, `createPopoutContent` (utils/popoutContent.ts) returns
focus to `context.anchorElement` -- which is now sometimes a component that opens on
focus, not just a passive trigger. PopoverHover/ContextualHover hit this: hiding
refocused their hover div, whose focus-to-open handler immediately reopened in a
loop. utils/hoverReveal.ts works around it with a one-shot `suppressFocusOpen`
guard armed right before hide. Any future focus-to-open component needs the same
guard; alternatively the runtime could distinguish script-driven refocus from real
user focus events.

### `tb --preview` fails to bundle .torp files (pre-existing)

`tb --preview` (wrangler dev over `dist/cloudflare/_worker.js`) dies with
"No loader is configured for .torp files" for every route view, including
pre-existing ones (HomePage, ErrorPage, ...). `tb --build` itself succeeds
and `tb --dev` is unaffected; deploys go through `buildcf.ts` + wrangler
deploy. Likely wrangler is re-bundling something that still references
`.torp` paths — worth investigating if local production preview is needed.

### Stale-module SSR errors after rebuilding a workspace package while `tb --dev` runs

Vite's dep cache (site node_modules/.vite) keys off the lockfile and config,
not the content of workspace packages, so rebuilt packages kept serving stale
prebundled modules to the workerd dev runner -- with confusing errors like
"$cache must be used in a getter" or "ReferenceError: $handle is not defined"
for identifiers that clearly exist in source.

`tb --dev` now fingerprints the workspace packages the site depends on at
startup (path, size, mtime) and deletes the dep cache when they changed
(packages/build/src/run/depCache.ts), which turns "restart and know the
trick" into "just restart". Still open: live invalidation while the server
is running -- after rebuilding a workspace package mid-session, restart the
dev server to pick it up. A watcher feeding Vite's module graph would remove
even that.

Related: the site resolves `@torpor/ui/*` to `packages/ui/dist`, whose
`.torp` files are COPIES made by the ui package's build (`vp pack`). If the
dist copy is stale (package not rebuilt after changing a component's API),
the site silently runs the old component -- hit as a
`$slot.day is undefined` TypeError on the calendar page after the
CalendarGrid slot API changed from `$slot.days` to `$slot.day`. Rebuild the
workspace package (and restart `tb --dev`) when site pages use new component
APIs. A check that dist `.torp` copies match src would catch this earlier.

## Features

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

### Dead/duplicated code paths elsewhere

- `src/site/Site.ts:33-35` — design TODOs about whether `defaultAdapter` and
  default plugins are a good idea. Not a HACK to remove; flagged for the
  framework's design discussion.

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
  request but there is no optimistic local sort or stale-request cancellation
  yet (the `AbortSignal` param exists on the Loader type, unused by DataGrid).
- `aria-rowcount` is set from the loader's `total` when provided; not wired to
  `aria-rowindex` on rows.

### Loader adoption in ComboBox/SelectBox: known gaps

ComboBox and SelectBox now accept the shared `load` prop (utils/loader.ts
`createItemLoader`) and auto-render a ListBox of loaded options when no
content is slotted in. Left out deliberately:

- No built-in debounce for ComboBox typing -- every keystroke starts a fetch.
  Consumers wrap their loader if they need it; a shared `debounceMs` option
  would be the nicer API (needs timer handling inside the reactive getter).
- Stale-response ordering relies on `$async`'s generation guard; no
  AbortSignal is passed to loaders yet, so cancelled fetches still run to
  completion over the wire.
- SelectBox loads once per mount (content stays mounted but hidden), not once
  per open; a refresh-on-reopen option may be wanted.
- ~~Tree lazy child loading doesn't fit this shape~~ -- it did after all: Tree
  loads each `hasChildren` item's children on first expansion via
  `createItemLoader`, gated behind an `@if` so the fetch starts when the item
  expands (see src/ui/Tree/TreeLoadedChildren.torp).

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

### Prebundling .torp libraries in dep optimization

Handled now: `@torpor/build` detects installed packages that ship `.torp`
files (a `torpor` field or `.torp` export targets in their package.json) and
automatically adds them to `optimizeDeps.exclude` and `ssr.noExternal`
(packages/build/src/utils/torporPackages.ts). What's left is the optional
performance follow-up, like Svelte's `prebundleSvelteLibraries`: registering
an optimizer plugin so `.torp` files can actually be _compiled into_ the dep
optimizer's bundle, instead of being excluded and transformed per-request in
dev (fine for icon packages, but it's an extra transform per module load).

### `$stream` follow-ups

`$stream(source, handler, options?)` shipped in `@torpor/view` (managed
external-event subscriptions: mount/unmount lifecycle, dep-tracked
resubscribe, SSR-safe). Deliberately left out:

- **Site docs page**: the docs site has pages for async (`$async`,
  `$pending`, `$refresh`) but not yet for `$stream`/`fromElement`/
  `fromServer`/`fromWebSocket`. TORPOR_AGENTS.md is the reference
  until then.
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
