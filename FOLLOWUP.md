# Follow-ups

Items that were noticed and deliberately left out of scope of a previous change.
Each entry should describe what was seen, where, and any relevant context.

## Standard schema validation: remaining integration points

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
  output schemas, potentially feeding OpenAPI generation). Runtime cost on
  every response; bigger feature.
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
- **Reserved schema keys**: on `PageServerEndPoint`, an action literally
  named `load` or `params` would collide with the reserved `load` (query) and
  `params` (route params) schema keys. Not enforced or warned about.

## Form re-render runs load query validation against the POST url (edge case)

When a form is submitted without javascript and the action returns a 4xx,
`runAction` re-renders the view by calling `loadView` with the POST's URL
(query preserved since this change). The load function's query schema is
validated against that query. If the form action URL drops query params the
load schema requires (e.g. a `?page=` param), the re-render fails validation
and redirects to the error page instead of showing the form errors. A
possible fix is skipping/satisfying load query validation during form
re-renders, or rendering from cached load data.

## Compiler injects runtime imports for $-identifiers in prose text

The .torp compiler injects `$watch` / `$mount` / `$props` etc. into a file's
generated imports when those identifiers appear ANYWHERE in the source --
including inside `<p>` prose (e.g. docs pages saying "from within a $mount
function") and inside Repl sample-code strings. When nothing actually reads
them, the import is unused. Site-side this is worked around with `void $props;`statements and`"noUnusedLocals": false` in site/tsconfig.json; the proper fix
is for the compiler to only inject when the identifier appears outside string
literals and plain text nodes.

## Dead/duplicated code paths elsewhere

- `src/site/Site.ts:33-35` — design TODOs about whether `defaultAdapter` and
  default plugins are a good idea. Not a HACK to remove; flagged for the
  framework's design discussion.

## Preview of built page sites fails at runtime (pre-existing)

`tb --preview` on page-based examples (`examples/demo`, `examples/mini`) returns
`{"code":"ERR_MODULE_NOT_FOUND"}` / `{"code":"ERR_UNKNOWN_FILE_EXTENSION"}` from
`dist/server/serverEntry.js` — its runtime imports (e.g. `.torp` route files)
aren't resolvable by plain Node. Reproduces at HEAD without the endpoints-only
site.html fix. Dev mode (`tb --dev`, which uses `vite.ssrLoadModule`) works fine.

## Calendar: day cells lack row/gridcell structure (component review)

Found during the Calendar APG review. The calendar grid has `role="grid"`,
an `aria-colcount`, and a proper header (`role="row"` > `columnheader`), but
the days are rendered as a flat list of buttons/spans directly inside the
grid -- no `role="row"` wrappers per week and no `role="gridcell"` per day,
so screen readers can't navigate it as a grid. The selected-day state is also
expressed as `aria-selected` on the `<button>`, which is only valid on a
gridcell/option/row/tab.

Fixing this properly is an API change: `buildDays` would need to group days
by week, and `CalendarGrid`'s slot contract changes from `$slot.days` to
weeks that users wrap in rows (or the grid renders days internally). Deferred
because it alters user-facing composition; everything else in the review was
fixed inline (single grid element instead of nested grids, reactive
`selectable` context getter so `aria-readonly`/`tabindex` update).

## DataGrid: known gaps from the first version

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

## Loader adoption in ComboBox/SelectBox: known gaps

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

## $bind silently no-ops when the state key differs from the prop key (view runtime)

`$bind(state, props, key)` syncs same-named keys. Binding a differently-named
state property (e.g. `$state.values` against `props.value`) compiles and runs but
syncs nothing — no warning. Found while building TagInput (named the state key
`values`); worked around by naming the state key `value` like ListBox/Tree do.
`$bind` could validate that each key exists on both objects and throw in dev.

## replaceForVarNames is textual rewriting with known blind spots (view compiler)

Loop-var rewriting in `@for` bodies is a boundary-class regex over raw expression
text, not AST-based. Recently hardened (string/template-literal contents are
skipped; `?` is a boundary so `item?.x` and `a ?? item` rewrite), but the approach
still has inherent blind spots:

- **Shadowing**: a nested function's param/`let` with the same name as a loop var
  gets wrongly rewritten -- `.filter(child => child.ok)` inside a `@for` body
  rewrites the arrow param into `t_item_1.data` (broken). Scopes are invisible to
  a text scan; needs an AST pass (e.g. acorn walk renaming resolvable
  `Identifier` nodes) to fix properly.
- **No-space operator styles**: `x=child`, `a+b`, `a&&b` etc. aren't caught --
  the operator characters aren't boundary chars. Usual spaced formatting is fine.
- **Comments and regex literals** in expressions aren't skipped (a comment
  containing a loop-var-shaped word gets rewritten; a regex literal containing a
  quote could desync the string scanner).

Object-literal keys that share a loop var's name are safe only by accident (no
`:` in the follower class -- adding it would break keys). The same textual
limitation family exists in the `@for` header parsing (`forLoopVarsRegex` has a
"Handle destructuring, quotes, comments etc" TODO) and in `isForBodyNoProxySafe`'s
write detection.

## TagInput loader suggestions: destructured @for var in handler is broken (view compiler)

`test/TagInput/loading.test.ts` ("clicking a suggestion adds it as a tag") fails
deterministically, and `pnpm check` in packages/ui reports
`TagInput.torp:326 - error TS2304: Cannot find name 'item'`. The component uses
`@for (let [index, item] of suggestions().entries())` inside `@await`, and the
li's `onmousedown` handler calls `pickSuggestion(item)` -- the generated client
code references the bare `item` identifier there (out of scope), so the click
handler throws and the picked suggestion never clears the query text.

Verified pre-existing: reproduces with packages/view src checked out at e0f1a803
(before the string-literal/`?`/spread compiler changes), so it's not a regression
from that work. Destructured for-vars (`[index, item]`) combined with an
`@await` boundary is the suspect: the handler effect referencing the second
destructured var escapes the scope the rewrite targets. Same family as the
fixed optional-chaining/@for issue and the replaceForVarNames blind-spot entry
above -- likely needs the AST pass to fix properly. (Note: `test/ToolBar/
popout.test.ts` "Multiple popouts" is separately flaky under full-suite load but
passes reliably in isolation; unrelated.)

## refocusAnchorOnHide focuses whatever component anchors the content

When popout content hides, `createPopoutContent` (utils/popoutContent.ts) returns
focus to `context.anchorElement` -- which is now sometimes a component that opens on
focus, not just a passive trigger. PopoverHover/ContextualHover hit this: hiding
refocused their hover div, whose focus-to-open handler immediately reopened in a
loop. utils/hoverReveal.ts works around it with a one-shot `suppressFocusOpen`
guard armed right before hide. Any future focus-to-open component needs the same
guard; alternatively the runtime could distinguish script-driven refocus from real
user focus events.

## Language server duplicates @torpor/check's compile-and-check pipeline

Found while modernizing the VS Code extension (now packages/vscode): the LSP server is now a standalone
workspace package (packages/language-server, with a `torpor-lsp` bin that
defaults to stdio), but it still carries its own copy of the same pipeline as
@torpor/check (packages/check/src/) -- transformDocument (compile a .torp
into TS via @torpor/view, rewrite imports of .torp components into virtual
.ts files), loadDocument (set up the @typescript/vfs environment from the
project's tsconfig), and error mapping back to source ranges. They will
drift. Worth extracting a shared package (e.g. @torpor/analyze) that both the
CLI check and the language server use.

## TypeScript 7 (native) is not yet supported by the language server

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

## Zed support needs an extension package plus a tree-sitter grammar

Zed can't consume a language server generically -- it needs an extension
(extension.toml + a small Rust shim) that registers the language, and Zed
wants a tree-sitter grammar for syntax highlighting (the TextMate grammar in
@torpor/textmate can't be used there). Until a tree-sitter-torpor grammar
exists, the extension can only provide partial support. The language-server
README documents setups for editors that work today (Neovim, Helix,
OpenCode).
