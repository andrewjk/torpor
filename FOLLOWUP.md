# Follow-ups

Items that were noticed and deliberately left out of scope of a previous change.
Each entry should describe what was seen, where, and any relevant context.

## Benchmark porting (torpor fixtures)

Ported torpor fixtures for 11 server-backed suites (all pass gates through
`node benchmarks/bench.mjs --quick <suite>`): js-framework, todomvc,
chat-stream, dbmon, recursive-context, signal-favoring, effectful-list,
memo-wall, portal-swarm, async-waterfall, list-clear. Each lives in
`benchmarks/<suite>/torpor-*` and the harness default TARGETS + bench.mjs
`servers` entries were updated.

### Not-portable suites (torpor's model can't satisfy the gate)

- **async-composition** — the transition gate requires the old dashboard to
  stay visible while the new version loads (`retainedOldResourceValues`).
  Torpor's `@await` tears down on promise reassignment, so `update` fails.
  A fixture is built (`benchmarks/async-composition/torpor-async-composition-bench`)
  but cannot be added to the manifest. Would need a Suspense-transition
  primitive.
- **SSR / streaming suites** (ssr-throughput, streaming-ssr, ssr-http,
  streaming-backpressure, ssr-workerd, tanstack-start) — measure octane's
  `renderToPipeableStream`/`prerender` streaming APIs; torpor's SSR
  (`@torpor/build` Site/Server) is a different architecture, not
  apples-to-apples.
- **octane-internal/compiler suites** (codegen-size, compiler-throughput,
  dbmon-deopt, js-framework-deopt, react-hosted-islands) — measure octane's
  compiler output / deopt cliff; torpor has its own compiler.
- **octane-only integrations** (three-_, lynx-_, weather-app-lighthouse
  needs review) — no torpor three/lynx runtime.
- **build-based news/hydration/runtime-stress suites** — need a full
  `news/torpor` SSR fixture + harness TARGETS updates; deferred (see the
  "everything feasible" option).

### Observed perf gaps (torpor vs octane, same harness, quick)

| suite             | torpor wins                      | torpor lags                                 |
| ----------------- | -------------------------------- | ------------------------------------------- |
| js-framework      | update 4x                        | runlots 0.71, clear 0.87                    |
| todomvc           | —                                | add100 0.44, edit10 0.24                    |
| chat-stream       | type160 1.6x                     | switchConv 0.21                             |
| dbmon             | —                                | tick 0.39, unmount 0.11                     |
| recursive-context | update_root 3x                   | mount 0.32                                  |
| signal-favoring   | mount 1.76x, bumps 2-13x         | —                                           |
| effectful-list    | update_nodeps 17x                | update_deps 0.05, mount 0.22                |
| memo-wall         | one_change_A 15x, ctx 1.2x       | mount 0.45                                  |
| portal-swarm      | mount_closed 1.7x, dispatch 2.5x | open 0.65                                   |
| async-waterfall   | —                                | init 0.13 (waterfall ~170ms vs octane 22ms) |
| list-clear        | all clears 1.3-1.6x              | —                                           |

The recurring lag pattern: **per-row mount cost** (dbmon/memo-wall/effectful-list
mount), **fine-grained update wins** (signal-favoring, recursive-context
update_root, update_nodeps), and **no compiler waterfall-elimination**
(async-waterfall ~8x octane).

## packages/view

### Infinite loop: `@if` inside a keyed `@for` over a reactive array

- `packages/view/src/render/runListItems.ts` relink walk
  (`while (next !== null && next.depth > item.depth)`). A `@for` that iterates
  a reactive array and contains an inner `@if` in its body hangs in an infinite
  synchronous loop as soon as the array is updated (e.g. toggling all todos in
  the TodoMVC benchmark fixture).
- Reproduced in `packages/view` (vitest) and in the browser with a minimal
  component: `@for (let t of $state.todos) { @key = t.id @if (cond) { <li/> } }`
  then `$state.todos = $state.todos.map(...)`. First update (on) works; second
  update (off) hangs. The page's main thread blocks completely.
- Root cause: the sibling region chain gains a **cycle** (depth 2 → 3 → 2 → 3)
  when the `@if` control re-runs during a list update. The relink walk then
  never terminates. Verified it's NOT the R15 incremental-relink fast path
  (forcing the full relink still hangs) and NOT caused by the recent relink
  perf work (pre-R15 `runListItems` also hangs) — a pre-existing bug.
- Workaround for fixtures: filter _outside_ the loop into a derived getter
  (`get visible() { ... }`) and avoid inner `@if`s in `@for` bodies. The
  TodoMVC torpor fixture uses this pattern for the list itself, but the per-row
  edit-input `@if` still triggers it — a component-wrapper or
  always-mounted+hidden `.edit` input may be needed.
- Triage: `runControl` re-run + region-chain splicing during keyed-list
  `update`. Tests to add: `for` containing `@if` with reactive-array updates
  (toggle, append, remove) — the existing `for-containing-if` test only covers
  a static `@for (let i = 0; i < 5; i++)`, which is why it slipped through.

### Deep-wrap lost on reassigned nested array after a prior read

- `packages/view/src/watch/proxyGet.ts`. Reading `$state.a[0].messages`,
  then `$state.a = $state.a.map(...)` (replacing the nested array), then
  reading `$state.a[0].messages` again returns the **raw** array — the
  `$watch` deep-wrap is skipped, so `find`/`findIndex`/`[idx]` return raw
  elements and in-place mutation (`msg.done = x`) does NOT propagate to
  effects.
- Minimal repro (`packages/view`, vitest): `$watch({a:[{messages:[{id:1}]}]})`;
  `void $state.a[0].messages.length`; `$state.a = $state.a.map(c => ({...c,
messages:[...c.messages, {id:2}]}))`; then
  `expect($state.a[0].messages[proxyDataSymbol]).toBeDefined()` FAILS (raw).
- Mechanism: the `convs` array's proxyData/signals map is REUSED across the
  reassignment (the new array inherits the old proxy's signal map via the
  proxy), so a subsequent `convs[0]` read finds an existing signal for `"0"`
  and takes the `signal.type === SIGNAL_TYPE` fast path (track + return
  `target[key]`) instead of the `propDescriptor.writable` deep-wrap branch.
  The freshly-assigned conv object at `target[0]` is therefore never
  `$watch`-wrapped, and its `.messages` array is never wrapped either.
- Workaround: mutate via **immutable replacement** (build a new array with
  `map`/spread and assign to `$state`) instead of in-place mutation of a
  nested element. The chat-stream torpor fixture's `__pump` does this.
- Triage: when a watched array is reassigned, either reuse the old proxy's
  signals correctly or ensure element deep-wrap happens even when a signal
  already exists. Tests to add: reassign nested array then read/`find`+mutate
  a deep element, after an initial deep read.

## packages/build

### Dead/duplicated code paths elsewhere

- `src/site/Site.ts:33-35` — design TODOs about whether `defaultAdapter` and
  default plugins are a good idea. Not a HACK to remove; flagged for the
  framework's design discussion.
