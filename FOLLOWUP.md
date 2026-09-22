# Follow-ups

Items that were noticed and deliberately left out of scope of a previous change.
Each entry should describe what was seen, where, and any relevant context.

## Bugs

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

### Plain `let` initialized from `$props` is a silent stale-capture trap in keyed lists

Found in redraft's PostInputFields.torp (multi-part post editor). A component
instantiated from a keyed `@for` gets its props updated in place on list
reconciliation -- the compiler emits a `$watch`ed props bag plus a
`forVarMask`-tagged effect that writes the new `i`/item values into it, and
`t_rerun_region_effects` re-runs matching effects -- so reads of `$props.i` in
template expressions track correctly. But `let prefix = \`children[${$props.i}]\``in the component body is evaluated once at setup: template effects reading`prefix` never re-run, so after children were spliced out the surviving
components kept the *previous* child's form field names (`children[1]...`instead of`children[0]...`) and the submitted form data was silently wrong.
By design a plain `let`isn't reactive, but the combination "keyed list keeps
the component instance alive AND updates its props" makes the non-reactivity
surprising and the failure invisible. Options: a compiler warning when a
template expression references a plain`let`whose initializer reads`$props`
(detectable syntactically), and/or a note in the reactivity docs.

### @torpor/ui form components don't apply a changed `name` prop to their input

The `name` of `Field` is captured once per component instance and then never
updated: `Field` builds `let context: FieldContext = { name: $props.name, ... }`
at setup, and `Input`/`TextArea`/`Select`/`File`/`CheckBox` each do
`let name = $props?.name; ... name ??= fieldContext.name;` before rendering
`<textarea {name} />` etc. So when a `Field`'s `name` prop changes after mount,
the rendered input keeps the old `name` attribute. (`Hidden` is fine -- it
applies its name reactively. `Field`'s `valid`/`message` getters are fine too --
they read `$props.name` inside tracked getters.)

Concrete failure in redraft's multi-part post editor: each child post is a
component whose form fields are named `children[${i}]...`. Removing a child
shifts the following children's indexes; their hidden inputs renamed correctly
but the `<Field><TextArea name=...>` kept the _old_ index, so the submitted
form contained `children[1]` (id etc.) plus a phantom `children[2]text` --
valibot then reported `Invalid key: Expected "id" but received undefined` and
`Text is required` on save. Site-side workaround for now: the child loop keys
by `i + "_" + child.id` so a child whose position changed remounts with fresh
field names.

Suggested fix: make the name a computed value that reads the prop and the
field context reactively (e.g. a getter on the component's `$watch` state:
`get name() { return $props?.name ?? fieldContext?.name; }`), or an `$run`
effect that sets the attribute. Same for `Field`'s captured context object --
store the context name in `$state` (or use a getter) so downstream
Label/Input/Message consumers see updates. This is the `@torpor/ui` instance
of the "plain `let` initialized from `$props`" compiler footgun above -- but
fixing it in the components is worthwhile regardless, since a changed `name`
prop is a reasonable thing for consumers to expect.

### Keyed `@for` silently misbehaves on duplicate keys

`runListItems` matches old/new items by key first-match-wins. With duplicate
key values in the data, updates and clears can hit the wrong regions and the
DOM desyncs from the data. Hit in redraft: two "new post" children both had
`id: -1` (generated independently by two component instances), and removing
the first cleared the _second_ child's region while showing the first's
content. A dev-mode warning on duplicate keys (where `newSpecs` is built, or
in `runListItems`) would surface this immediately. (The data bug was fixed on
the app side by generating unique ids.)

### `mount()` fails silently (plus an unhandled rejection) with an SSR-compiled component

Mounting a component that was compiled with `{ server: true }` renders nothing
into the parent and doesn't throw; the test process also got an unhandled
rejection from `serverFlush`/`withServerAwait` (dist/ssr.mjs). This bites with
the unplugin's `test: true` option (redraft uses it so page tests can call
components as functions and assert on the HTML): every `.torp` import in that
project is SSR-compiled, and `mount()` then appears to no-op. The two shapes
are distinguishable -- SSR components take `(props)` and return `{ body }`,
client components take `(parent, anchor, props, context, slots)` -- so `mount`
could throw a clear "component was compiled for SSR" error.

## Features

### DataGrid: expose reload-pending state for loader grids

A loader-backed DataGrid shows the `loading` slot on the first load, but a
sort/page-triggered reload is silent: stale rows stay visible with no
`aria-busy` and no indicator hook (`DataGrid.torp`, `runLoad` resolves
through `$async` into the `@await` boundary, which doesn't re-trigger once
content is shown). Consumers that own their `load` function can track
pending state themselves (the site's DataGrid Loading example does this),
but grids consuming a passed-in loader have no way to show reload feedback.
Options: an `aria-busy` + `data-loading` attribute on the table while a
reload is pending, an `onloadstart`-style event to pair with `onload`, or a
`reloading` named slot. Seen while adding a loading indicator to the
DataGrid docs example.

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

### Sanitizing rendered markdown

The markdown pipeline (`site/src/lib/markdown`) renders allmark output
straight into `@html(...)` without sanitizing it (see `createDoc` in
`site/src/lib/markdown/index.ts`, the natural boundary). Fine today: content
is authored in-repo and code-reviewed. Becomes mandatory before any
user-submitted markdown exists (e.g. the CRM scenario, where item
descriptions written by users get re-used across search, product pages,
etc). allmark's README explicitly warns to sanitize its HTML output.
Note: `sanitize-html` has been archived, so pick a maintained,
worker-compatible alternative -- `rehype-sanitize` (unified ecosystem,
allowlist schema, pure JS so it bundles for the Cloudflare adapter) or
equivalent; DOMPurify needs a DOM/jsdom, which doesn't work in workers.

### Interactive components in markdown (MDX-lite)

The site's markdown pipeline (`site/src/lib/markdown`) renders content to
static HTML; there's no way for a post to embed live Torpor components. Sketch
for when it's actually needed: allmark's extensibility hooks (custom block
rules + renderers) could add a `:::carousel` style fence rule whose renderer
emits a placeholder like `<div data-torpor="Carousel"
data-props='{...}'></div>`, and `PostPage.torp` would use `$onmount` to find
placeholders and swap in real components client-side (`$watch`-wrapped props
from the parsed JSON). Interacts with any future sanitization of the
rendered html (see the sanitization entry) -- the `data-torpor`/`data-props`
attributes would need allowlisting, or (better) placeholders are injected
_after_ sanitization so component props never run through the tag filter.

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
