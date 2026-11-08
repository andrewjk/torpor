# SERVER_PLAN — restricted-mode server rendering

Status: **decision record + build plan.** Agreed in review on 2026-11-06. Not
started, and not to be started without a new instruction — pick up any phase
independently when it is.
Audience: whoever implements `packages/embed` (+ one prerequisite slice in
`packages/view`).
Context: `SAAS_EMBED.md` / `SAAS_EMBED_2.md` (Mallet), `SOCIAL_EMBED.md` /
`SOCIAL_EMBED_2.md` (redraft), `FOLLOWUP.md` ("SSR on Workers…"), the README
"documented split" section this plan eventually replaces.

## The decision

SSR today evaluates the stored server build with `new Function` — legal on
Node, banned on workerd (no code generation from strings), and a
remote-code-execution surface the moment the author isn't fully trusted.

**Restricted mode** changes what the _server_ build is: not JS at all, but a
serialized instruction tree, interpreted by trusted code. Consequences:

- **Workerd-legal SSR**: the worker never generates code; the interpreter is
  bundled, ordinary JS. Edge apps get true SSR for restricted embeds (today's
  supported mode there is client-only).
- **A real rendering boundary for untrusted authors**: the artifact is data.
  The expression/op set the interpreter understands is the entire surface.
- **The wire format is unchanged**: the client receives **HTML + compiled
  JS**, not instructions. Instructions never leave the server; shipped
  instructions would mean double-implementing the engine in the browser
  (classic SDUI) for no gain — that option is rejected (see Out of scope).
- **Authoring is restricted up front**: the client build is full torpor
  (JS runs only on the client, as authors expect), while whatever runs
  server-side must compile to the op set. There is nothing for an author to
  "cheat" with: the compiler does not audit code, it **fails to represent**
  what the format cannot express, with positioned errors at save time.

## Locked decisions (from review)

- **Explicit opt-in**: `compileEmbed(..., { restricted: true })`. The plain
  Node SSR path is untouched until restricted stabilizes; restricted may
  become the default for embeds later, behind review.
- **Names**: artifact `format: "restricted"`; render API
  `renderRestricted`; new edge entry `@torpor/embed/restricted`
  (function/entry naming is bikeshed at implementation; the _format name_
  is locked — "embedded" self-collides with the package's own vocabulary).
- **Hydration v1**: SSR paints; the client **mounts fresh** (documented
  swap), via the existing `mountEmbed`. Exact-parity hydration is a later
  phase, gated on parity goldens.
- **Data across the boundary by construction**: data resolution happens in
  the _host's_ runtime through a small requirements contract; the artifact
  never carries code, SQL, secrets, or credentials — only references.
- **Deep links**: host passes route params as props (`/tickets/42` →
  `$props.id`); inline detail flows over the existing bridge (`invoke`).
  No package work — it's a docs example.

## The requirements contract: kinds vs instances

Admin-authored embeds may need data from sources the host operator has
never heard of. The host cannot know APIs; it has to know **mechanisms**.

- The artifact carries a **source kind** plus an **inert spec** (endpoint,
  serializable params — `$props` refs allowed, credential _name_ — never the
  key — and a `pick` path). Example:
  `data tickets from http { url: "https://api.corp.dev/tickets", auth: "corp-key", params: { queue: $props.queue }, pick: "items" }`
- **Source kinds** are either shipped generic mechanisms (`http` in phase 3,
  `derive` in phase 4, `graphql` possible later — all validated specced, no
  logic), or **first-party implementations** the host registers as code
  (`sources: { tickets: (spec, ctx) => ... }` — the "host implements how"
  tier, for anything the operator knows). Unknown kinds are caught at
  authoring time.
- **Policy is deployment configuration, never artifact content**: egress
  allowlists (deny-by-default; enforced at the fetch boundary — workers
  `globalOutbound` / Node egress wrapper), per-source enablement,
  credential→secret bindings held host-side and resolved at fetch time,
  request timeout and response-size caps, JSON content-type requirement.
  Compile validates **shape** (origin is a literal, params are
  serializable); the _deployment_ validates **policy** (is this origin
  allowed, is this credential this tenant's) — tenants differ, so policy can
  not be baked in.
- **Weird filtering/joins**: `derive` (phase 4) evaluates pure transformations
  over requirement results using the same op set, with row/time budgets —
  no host code needed for filter/sort/shape. Cross-source **joins** are
  deliberately out: correlate in torpor client-side or in a host saved
  query. The artifact format never grows a query language; query
  expressivity lives where it can be authorized.

## Artifact shape (sketch — final naming at build time)

```jsonc
{
	"id": "tickets-section",
	"name": "TicketList",
	"version": "1.2.6",
	"source": "…torp source…",       // source of truth, for recompiles
	"format": "restricted",
	"imports": […],                   // host fns used in expressions (e.g. format)
	"requirements": [                  // instances: kind + inert spec
		{ "name": "tickets", "kind": "http", "spec": { "…": "…" } }
	],
	"client": { "code": "…" },        // full client build; data names bound as props
	"server": { "template": [ /* instruction ops */ ] },
	"styles": […]
}
```

The client build runs through the existing loaders unchanged (`mountEmbed` /
`hydrateEmbed`): data names arrive as props — on SSR, the resolved `$data`
bag; on fresh mounts, whatever the host passes.

## Phases

### Phase 1 — compiler core (`@torpor/view/compile`; minor)

Status: **implemented** (2026-11-06) — `buildRestricted`, requirement
parsing, the expression parser and their tests. See "Phase 1
implementation notes" below for the decisions made while building.

The prerequisite for everything; the largest single slice.

- A restricted/data build target next to `buildCode`/`buildServerCode`
  (same AST → three emissions): serialize the server tree into the
  instruction format for the v1 node subset (elements, text/interpolations,
  static/dynamic attributes, `@if`, `@for`).
- Requirement syntax (`data <name> from <kind> { <inert spec> }`): parse,
  hoist before markup, validate the spec against the kind's declared shape,
  bind `<name>`s as props in the client build so hydration/mount receives
  the resolved bag.
- Expression serializer with the v1 op set (locked inventory kept in this
  doc's appendix as it lands): literals, `$props`/`$data`/loop-var
  references, property/index access, arithmetic/comparison/logic, ternary,
  array/object literals — and **no calls**. Template expressions are a pure
  presentation layer; formatting/derivation belongs in the data layer
  (`derive`), where host functions run with budgets and results ship to the
  client with the paint (server/client parity by construction). Everything
  else — authored functions, calls, closures, `new`, mutation, `await`,
  optional chaining, template literals — is an authoring-time error naming
  the nearest legal alternative ("move it into `derive` / a host
  requirement").
- **Expression parsing is hand-rolled** (`build/restricted/parseExpression.ts`):
  a ~200-line tokenizer + precedence-climbing parser producing the op set,
  with positioned errors. No dependency is added (`@torpor/view` stays
  dependency-free) and no general JS parser is written: the grammar is
  exactly the op set, which is the permanent format API. Regex-based
  tokenizing was rejected — it breaks on operators inside string literals
  and cannot express precedence; balanced-delimiter scanning already exists
  in the parser.
- Script-body policy: scripts exist client-side only; `$watch` initializers
  must derive from props/literals (serializable into the paint state).
- Deferred node types (record the reasons): slots, nested components,
  special elements (`@head`, `@html`, dynamic), `@await`, `@error`.
- Tests: serialization fixtures per op and per node type (snapshot next to
  the existing output goldens), subset-error position tests, client-build
  binding tests.

#### Phase 1 implementation notes (2026-11-06)

- **Requirements are file-level**: `data name from kind { … }` at the top
  level of the file (before or between components), stored as
  `Template.requirements`, matching the examples in this doc. `$props`
  references in the spec are symbolic (the host resolves them when the
  requirement runs); no JS is emitted for the spec.
- Both JS builds (client and server) get `let $data = $props?.$data ?? {};`
  injected at the start of every component body when the file has
  requirements, and the declarations are replaced by a
  `/* data requirement */` comment in the script chunks. Authoring
  `$data.x` therefore works unchanged in both builds; the host passes the
  resolved bag under the `$data` prop.
- `buildRestricted(template, { source, requirementKinds?, preserveWhitespace? })`
  returns `{ program, styles, errors }`; `program` is
  `{ requirements, components: [{ name, default, markup }] }`.
- **Call it on a freshly parsed template.** It maps text interpolations
  through parse-time source spans, and `build()` trims whitespace nodes in
  place (invalidating those spans). Phase 2's `compileRestricted` must run
  the restricted build before `build()`/`buildServerCode`, or re-parse.
- Expression grammar is exactly the op set (no calls): calls, arrows,
  `new`, `await`, assignments/updates, template literals, spread, and
  `__proto__`/`prototype`/`constructor` keys are all positioned compile
  errors. (Optional chaining is supported — it maps to `get`/`index` with
  `optional: true`.) Requirement specs use the same parser for
  values, plus a small spec reader (trailing commas allowed).
- v1 node subset: elements, text/interpolations, static/dynamic attributes,
  `@if`/`@else if`/`@else`, `@for` (single identifier + `of` only, optional
  `@key`). Events (`on*`, `:on*`), `&ref`, and `transition*` attributes are
  omitted from the server tree; comments are dropped; mixed
  static/dynamic attribute values are rejected. Deferred with errors:
  slots, nested components, special elements (`@head`, `@html`, dynamic
  tags), `@switch`, `@await`, `@try`, `@replace`, `@const`, `@function`,
  and component `@head`/`@error` blocks.
- Scoped styles match the JS server build: static classes get
  `torp-<hash>` appended, dynamic `class` values carry `format: "class"`
  with `scoped`, other dynamic attributes carry `format: "attr"` and are
  conditional/escaped at render, `style` carries `format: "style"`.
- Unknown requirement kinds are a compile error; per-kind shape validation
  is a `requirementKinds` map of `(entries, report) => void` validators
  (the `http` kind lands in Phase 3).
- Whitespace: restricted mode does not call `trimWhitespace` (spans);
  literal whitespace is collapsed unless `preserveWhitespace`, and
  `pre`/`code` preserve it. Visual intent is preserved; exact byte parity
  is Phase 5's problem.
- Tests: `test/restricted/expression.test.ts` (14) and
  `test/restricted/serialize.test.ts` (13). View suite green (1074).

### Phase 2 — interpreter + first-party sources (`@torpor/embed`; minor)

Status: **implemented** (2026-11-06) — new edge-safe
`@torpor/embed/restricted` entry with `compileRestricted`,
`renderRestricted` and `recompileRestricted`; `compileEmbed` is unchanged.

- `renderRestricted(artifact, { props?, data?, sources?, bridge?,
  runtimeVersion? })` resolves requirements through host implementations
  (spec expressions evaluated against `$props`, then
  `sources.<kind>(spec, ctx)` — may be async), interprets the instruction
  tree to `{ body, head, styles }`. Version checks default to the
  build-time `RUNTIME_VERSION` constant (no Node builtins in this entry).
- Value formatting reuses `@torpor/view/ssr`'s `t_fmt`/`t_class`/`t_style`/
  `t_attr`, so output matches the Node SSR path (text escapes `& < >`,
  attribute text escapes quotes, class/style semantics identical, empty
  class/style attributes omitted).
- `compileRestricted(id, source, { version?, preserveWhitespace?,
  maxSourceBytes?, requirementKinds?, meta? })` runs `buildRestricted`
  before `build()` (span ordering), strips TS from the client build,
  records `imports` (for the loader's scope validation), and stores
  `format: "restricted"`, `server: { template }`, `client.code`, styles.
- Artifact `format` gained `"restricted"`; `server` is now optional
  (`{ code?, template? }`). `renderEmbed` refuses restricted artifacts
  with a pointer to `renderRestricted`; `loadServerComponent` requires
  `server.code`.
- Paint-then-mount documented and tested: `mountEmbed` works unchanged on
  the client build (data names read `$props.$data`); the host passes the
  resolved bag as `{ $data: data }`.
- Expression change during implementation: **optional chaining is
  supported** (`get`/`index` carry `optional`), matching the client build;
  non-optional member access on nullish throws like JS (parity), so
  `$data.x?.y` is the safe read. Template literals/arrows/calls stay out.
- Edge bundles: `test/edge-bundle.test.ts` now checks both the compile and
  restricted entries (no `node:`, size budgets).
- Tests: `test/restricted.test.ts` (13) covering compile shape, source
  resolution (sync/async/`data`), escaping, version enforcement, compile
  errors with positions, recompile, and paint-then-mount parity.

### Phase 3 — the `http` source kind (`@torpor/embed`; minor)

Status: **implemented** (2026-11-07) — `createHttpSource` (runtime
mechanism) and `httpRequirementKind` (compile-time shape validator), both
exported from `@torpor/embed/restricted`.

Implementation notes (v1):

- Spec: `url` (string literal, `http:`/`https:`, no embedded credentials),
  `auth` (credential name literal), `params` (object literal; values are
  restricted expressions — typically `$props` refs — appended as query
  params), `pick` (dot path; numeric segments index arrays), `limit`
  (positive integer, clamped by the operator's `maxRows`). GET only; there
  is no path interpolation, no headers, no POST bodies yet.
- `createHttpSource(options)`: `allowOrigins` (exact origins, **default
  deny**), `credentials` (name → `{ header?, value, prefix? }`, default
  header `Authorization`), `timeout` (default 5s), `maxResponseBytes`
  (default 1MB, streamed cap), `maxRows` (default 1000), `fetch` override
  (tests / egress proxy).
- Fetch posture: `redirect: "error"`, `AbortSignal.timeout`, JSON
  content-type required, literal private/loopback/multicast hosts blocked
  even when allowlisted (DNS-level egress control remains the deployment's
  job), response size enforced while streaming.
- Errors name the requirement/origin/path/credential but never include
  query strings or other credentials' values; the host can surface
  `error.message` to the editor.
- Compile-time validator (`httpRequirementKind`) reports unknown keys, a
  missing/non-literal `url`, non-literal `auth`, non-object `params`,
  malformed `pick`, non-positive `limit`, non-http(s) or credential-bearing
  URLs — all with source positions.
- Tests: `test/http.test.ts` (13) — shape validation, end-to-end
  `renderRestricted` with a mocked fetch (auth header, prop interpolation,
  pick/limit), default-deny origin policy, unknown-credential errors without
  value leaks, non-JSON, HTTP status messaging without query strings,
  oversized responses, invalid JSON, missing pick path, `maxRows` clamping,
  private-host blocking, and inert (escaped) adversarial row data.

### Phase 4 — `derive` (`@torpor/embed`; minor)

Status: **implemented** (2026-11-07) — `deriveRequirementKind` (compile-time
shape) and built-in resolution in `renderRestricted`; spec expressions may
call host functions via the new `formatters` option.

Implementation notes:

- Spec: `of` (required literal naming an _earlier_ requirement — enforced by
  the validator via a new context argument carrying declared names), `where`,
  `map`, `sortBy` (expressions with `$item`/`$index`/`$props` in scope),
  `order` (`"asc"` default / `"desc"`) and `limit` (positive integer).
  Sorting is stable (ties keep input order); results are the mapped values,
  capped by `maxOutputRows`.
- Calls: `parseExpression`/`parseExpressionPrefix` gained an `allowCalls`
  option. Template expressions keep calls rejected; requirement specs (all
  kinds) now allow them, and `renderRestricted` evaluates specs with
  `options.formatters`. Method calls (`a.b()`) stay rejected everywhere.
- `derive` is built into `renderRestricted` (not a host `sources` entry)
  because it runs per row: its spec expressions are handed to the resolver
  unevaluated, unlike other kinds. It reads only earlier resolved data.
- Host functions (`formatters`) are the only callable surface and exist only
  in the data layer; a missing function fails loudly with its name.
- Budgets: `deriveLimits { maxInputRows (5000), maxOutputRows (1000),
  timeoutMs (50) }`; violations are render errors.
- Tests: `test/derive.test.ts` (10) — filter/map/format/sort/limit
  end-to-end, ascending order + `$index`, chained derives, composition with
  the http kind, unknown formatter errors, method-call rejection at compile
  time, shape validation (missing/non-literal/forward `of`, bad order/limit,
  unknown keys), budgets (input/output/time), pre-resolved data bypass, and
  non-array input errors.

### Phase 6 — client state (restricted templates become fully reactive)

Status: **implemented** (2026-11-07).

The original v1 restriction "restricted templates can't reference `$state`"
made restricted embeds little more than painted HTML. This phase lifts it
the way the design always intended: **scripts are stripped on the server but
run on the client.**

- `buildRestricted` scans each component's script chunks for
  `let <name> = $watch(<initializer>)` declarations and serializes each
  initializer as a restricted expression over `$props` (scanned with a
  sticky anchored scan that skips strings/comments/regex literals; type
  annotations tolerated; balanced-paren extraction over the full text so
  string literals containing parens don't break it). Stored as
  `component.state: [{ name, init }]` in the program.
- `renderRestricted` evaluates each initializer against `$props` and puts
  the results in scope, so `$state.count` renders the initial paint from
  data.
- The client build is unchanged — full torpor: `$watch` state, handlers,
  client-only imports via `scope`. `hydrateEmbed` adopts the SSR paint and
  binds the real reactive state from the same props, so the initial render
  matches and every interaction after that is ordinary reactive torpor
  (counters, list mutations, toggles).
- Compile-time rules: initializers may reference only `$props` (plus
  literals/operators); getters, calls, and non-prop refs are authoring-time
  errors (they can't be serialized for the server, and allowing them would
  break SSR/client parity). Template expressions are validated against the
  known roots (`$props`, `$data`, state names, loop variables) — typos and
  unknown roots are compile errors instead of render errors. Requirement
  specs may reference only `$props`.
- Tests: `test/state.test.ts` (6) — SSR initial paint from props-derived
  state, hydration with reactive updates (click increments), client-side
  list mutation via handlers, loop/state scope coexistence, initializer
  restriction errors, unknown-root compile errors.
- Known limits (documented, not enforced): getters/computed fields in state
  initializers are rejected (compute in `derive` or handlers); `$state` is
  not visible to `derive`/requirement specs (server data layer); a
  locale-sensitive `formatDue`-style formatter used only client-side will
  differ from SSR text unless the same value ships in `$data`.

### Cross-artifact restricted components

Status: **implemented** (2026-11-08).

- `restrictedComponent(artifact, options)` wraps a restricted artifact as a
  server component for another restricted template's `components` map; the
  inner artifact renders recursively with its own sources/formatters/limits.
- `renderRestricted` gained `slots` — incoming slot renders — and `<slot>`
  regions call them with slot props evaluated in the inner scope
  (`<slot item={row}>`), falling back to their fallback children. The
  restricted serializer now serializes slot props.
- Client side: the inner artifact's client build rides the outer's `scope`;
  `loadComponent` is exported for the `$data` adapter. Wrapper cycles
  overflow the stack (documented; construct acyclically).
- Styles: the wrapper inlines the inner artifact's styles into `head` as
  `<style id='…'>…</style>`, matching the JS server build byte-for-byte
  (tested against a JS host component doing the same job).
- Auto-close guard: slot regions whose wrapper the HTML parser can
  auto-close reject violating fill content at SSR with an actionable error;
  violating restricted fallbacks are compile errors (see FOLLOWUP.md).

### Aggregates in derive

Status: **implemented** (2026-11-08).

- `count`, `sum`, `min`, `max`, `average` spec keys turn a derive into a
  single-object result over the rows passing `where` (SQL-style null
  skipping; empty set gives `count: 0`, `sum: 0`, `null` otherwise).
- Aggregates are mutually exclusive with `map`/`sortBy`/`order`/`limit`
  (compile error from `deriveRequirementKind`); `where` still filters.
- `resolveDerive` computes them in the same budgeted single pass.
- Joins and `group by` remain out of scope.

### Components and slots in restricted mode

Status: **implemented** (2026-11-07).

- The restricted serializer serializes component usage (`<Card>` →
  `{ t: "component", name, props, fills }`) and `<slot>` elements
  (`{ t: "slot", name, children }` — children are the fallback; the parser
  wraps them in filldef nodes, which the serializer unwraps).
- `renderRestricted` gained `components: Record<string, ServerComponent>` —
  host **server components** (the server builds of host UI components or
  JS-format embeds). The interpreter calls them with (props, context,
  slots), inlines `body` into the output, and appends `head` to the result.
  Fill children may read `$slot.<name>`: the interpreter binds the slot
  render's first argument (the slot props the host component passes, e.g.
  per-row data) into the fill's scope. Byte parity with the JS server
  composition is exact, including the hydration markers the JS build wraps
  component and slot regions in (`<![>` … `<!]><!>`) — the interpreter
  emits the same markers around component usages and `<slot>` fallbacks.
- Client side: nothing new — the full client build compiles component
  usage and slot fills natively; component identifiers resolve from the
  mount-time `scope`.
- Unknown components fail at render time with their name; the host decides
  build-vs-fallback policy. Scoped classes on component usages are covered:
  when a usage's `class` matches the template's `@style` selectors (or has
  any reactive value), the serializer marks the prop `scoped` and the
  interpreter passes it as `[value, "torp-<hash>"]`, matching the JS server
  build byte-for-byte (tested in restricted-components.test.ts). Bare
  component props are passed as `true`, also matching the JS builds. See
  FOLLOWUP.md for the eval-hydration caveat with element-root fills.

### Phase 5 — hydration parity (stretch; flip the default)

Status: **implemented** (2026-11-07) — 9 parity tests compare
`renderRestricted` byte-for-byte with the real JS server build, and
`hydrateEmbed` adopts restricted SSR output. Hydration is now the documented
path (mount remains available).

Implementation notes:

- Parity suite (`test/parity.test.ts`): elements/attributes (static,
  dynamic, conditional, boolean), scoped styles + dynamic classes + style
  objects, optional chaining/nullish, `@if`/`@else if`/`@else` (all
  branches), `@for` with `@key` + nested control + data bag, whitespace-heavy
  markup, `pre`/`code` preservation, void elements and escaping. Each case
  renders the same source twice — interpreter vs
  `build(template, { server: true })` — and requires **exact** equality of
  body and styles.
- Hydration markers: the interpreter now emits the server build's bogus
  comments (`<![]>`, `<!^n>` branch indices, `<!^>` per-row breaks, `<!]>`,
  `<!>` anchors), including the synthetic-`@else` index when no branch
  matches.
- Deviations found and fixed (interpreter or serializer, never the goldens):
  - whitespace trimming now matches `build()` (restricted build calls
    `trimWhitespace`; safe for interpolation spans, since only
    whitespace-only nodes change);
  - text nodes merged from `addSpaceElement`'s leading whitespace node now get
    a source anchor (`TextNode.start`), so interpolations in
    newline-prefixed text are mapped (previously emitted literally);
  - attribute joining mirrors the server build exactly: falsy conditional
    attributes and empty class/style contribute empty strings, producing the
    same spaces in the output;
  - `$data` binding no longer mutates the `/* @start */` marker chunk (which
    broke the server build's exact-match and dropped `t_body`/`t_head`
    declarations); it is a separate chunk after the marker.
- Hydration integration test: restricted SSR → DOM → `hydrateEmbed(...,
  { bridge, styles: false })` → an event handler wired through the client
  build fires over the bridge.
- README updated: restricted mode documents hydration; the "JS-format SSR
  requires Node" note now points Workers at restricted mode instead of
  calling client-only the supported mode.

## Testing strategy (whole span)

- Snapshot fixtures per serialized op/node (phase 1), diffed against the
  committed goldens.
- Security cases woven into phases: adversarial JSON (unknown ops, prototype
  keys) rejected by the interpreter; origin-literal enforcement; credential
  indirection; inertness of data under hostile payloads.
- Edge-safety bundle test extended to the new entry (no `node:`, size
  budget) — same approach that guards `@torpor/embed/compile`.
- End-to-end per phase: the ticket list renders on "workerd" (plain
  node/jsdom execution of the edge entry — no `new Function` anywhere);
  Mallet-shaped section against first-party sources; recompileEmbed path
  covers restricted artifacts (version bumps recompile exactly as today).

## Risks

- **Op-set creep** — the one structural risk: each op is permanent spec
  weight and potential attack surface. Process: additions require a fixture,
  a parity golden, and a row in the appendix inventory.
- **Two-target compiler drift** — the restricted serializer and `buildCode`
  share one AST; drift is checkable by phase-5 goldens, and the serializer
  lives next to `buildCode` for review.
- **Swap flash on mount** — accepted for v1 (flagged, documented); parity
  phase removes it.
- **Generic-http abuse** — meaningful new egress surface for operators;
  default-deny policy, caps, and the operator-configuration framing are the
  mitigations. The SaaS decides whether `http` sources are enabled.
- **Author ergonomics** — subset refusal errors must always propose the
  legal alternative; judged by the ticket-list example staying natural.

## Out of scope (explicitly)

- Shipping instructions to the browser (SDUI-by-instruction-set) — rejected;
  we ship HTML + JS.
- QuickJS/WASM and Worker Loader renderers — separate paths, recorded in
  `FOLLOWUP.md` and the README roadmap.
- A restricted _scripting_ tier in the browser (codemode-style interpreter
  for author logic) — a different feature, noted for later.
- Authoring UX, field schemas, storage, tenant authorization — host-side
  (Mallet/redraft), unchanged by this plan.
- Streaming SSR — `renderRestricted` returns strings like `renderEmbed`
  today; both are string-first by design.

## Expected file map

- `packages/view/src/compile/build/restricted/…` — serializer (+ kind shape
  registry for requirement validation)
- `packages/embed/src/restricted/…` — interpreter, requirement resolution,
  per-kind sources (`http.ts`, `derive.ts` land in their phases)
- Exports: `@torpor/embed/restricted` (new edge entry);
  `@torpor/embed/compile` gains the `restricted` build option and the
  restricted serialize path
- Tests: `packages/embed/test/restricted.test.ts` (phase 2),
  `test/parity.test.ts` (phase 5), `test/edge-bundle.test.ts` entry list
  grows

## Open questions (decide as each phase lands; record resolutions here)

- Exact v1 op-set inventory — frozen in the appendix as ops land.
- Formatter signature validation depth: shape-check host `format`-like fns
  at compile time (arity/type hints) vs trust them render-time like today's
  scope.
- `@for` v1: keyed iteration? index exposure?
- Attribute binding forms in scope for v1 (static / variable / conditional /
  spread) — likely static + variable first.
- Error rendering in restricted mode (`@error` blocks) or hard render
  failure with a host-visible error object (v1: the latter).
- SSR-output caching key for hosts (per-server request; hosts may cache on
  `(artifact.version + vars)` — worth documenting, not enforcing).
- Entry name bikeshed: `@torpor/embed/restricted` vs `…/render` (fix at PR).
