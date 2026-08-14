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

## Async model Stage B — `@loading` boundary

Stage B (ASYNC.md §7.7) shipped `$await` (promise indicator + `didSuspend`),
`@loading` boundary, and the parser/codegen/runtime pipeline.

### Not yet implemented

- **`$pending` query — quiet-on-refresh implemented.** `$pending` now
  distinguishes first-load and dependency-change refreshes (both *loud* →
  `true`) from a bare refresh (re-fetch with no dependency change → *quiet* →
  `false`), per ASYNC.md §7.4. The decision is captured at suspend time in
  `$await`'s run via two new `Computed` fields: `hasResolved` (monotonic, set
  on resolve/reject) and `suspendQuiet` (`hasResolved && !recalc`). The peek
  branch in `proxyGet.suspendRead` only records a loud hit when
  `!suspendQuiet`. Torpor has no `refresh()` primitive yet, so a bare refresh
  can't be triggered through the public API — the quiet path is exercised in
  `test/pending` by calling `runComputed` directly (what a future `refresh()`
  would do). When `refresh()` lands, it re-runs the computed without setting
  `recalc`, and `$pending` stays quiet automatically. §7.8's "first-load
  semantics" open question is resolved: first load is per-computed (via
  `hasResolved`), and an `@if` branch that mounts and reads a never-resolved
  computed is a first load; reading an already-resolved computed is not.
- **Compiler check for promise-getter requirement.** Not yet implemented
  (ASYNC.md §7.2). The compiler should reject promise-returning getters
  that use `$cache` instead of `$await`. Currently enforced at runtime by
  the `$cache` guard. A static check would need type information the
  template compiler doesn't have — TypeScript's own type checker is the
  natural home for this.
- **Fine-grained updates within `@loading` content.** The boundary effect
  re-runs on any dependency change and may re-render content if suspend
  state changed. Non-suspend dep changes (e.g. a toggle inside content)
  are handled by child effects, but the `anySourceSuspended` check walks
  `effect.firstSource` on every run — O(N) in the number of sources.



### Dead/duplicated code paths elsewhere

- `src/site/Site.ts:33-35` — design TODOs about whether `defaultAdapter` and
  default plugins are a good idea. Not a HACK to remove; flagged for the
  framework's design discussion.

## Error boundaries (`@try`/`@catch` and `@error`) — Stage A gaps

Stage A (ASYNC.md §7.7) shipped `@try`/`@catch` and the top-level `@error`
block: `parseControl.ts` `@try group` + shared `@catch` attach, `buildTryNode`
/ `buildServerTryNode`, `@error` in `parseCode.ts`/`buildCode.ts`/
`buildServerCode.ts`, hydration snapshot/restore helpers
(`render/saveHydration.ts`, `render/restoreHydration.ts`).

### Not yet implemented (Stage B / follow-up)

- **Effect-rerun error routing.** The compiled `try/catch` only catches errors
  thrown synchronously while building the boundary's subtree (initial render,
  child component renders, direct `@const` reads). A `$run` effect created
  inside the boundary that throws on a *later* re-run (e.g. a text
  interpolation getter that throws after a state change) still propagates out
  of `triggerEffects.ts:58-60` and breaks the app. Routing effect errors to the
  nearest boundary region needs a runtime hook (e.g. `Region.onError`, walked
  from the effect's owning region in `triggerEffects`) — deliberately deferred,
  it touches reactivity.
- **Recovery outside direct reads.** Recovery (catch → try) currently works
  only when the erroring expression is read *directly* by the boundary's
  control effect — i.e. via `@const` or a nested control condition. Reads
  wrapped in `$run` effects (text/attribute interpolation) are tracked by the
  nested effect, not the boundary, so once the catch branch renders it stays.
- **Top-level `@error` recovery.** Same as above but structural: the `@error`
  try/catch wraps only the *initial* `@render` build; a later re-render error
  (from a nested control re-running after a prop change) is not caught, and a
  later recovery can't clear the already-rendered error content. Needs the
  same boundary machinery.
- **Partial render on mid-build throw.** If a `@try`/`@error` subtree throws
  *after* some DOM was added (throw after `t_add_element`/`t_add_fragment`),
  the partial content isn't cleared before the catch branch renders. The
  common case (throw during compute, before fragment insert) is clean because
  `buildRootNode` inserts only at the end.
- **Server `t_try_body` snapshot** discards any `t_head` appended before the
  throw (`buildServerCode.ts` / `buildServerTryNode.ts` restore only `t_body`).
  An erroring render that had already appended `<head>` tags leaves them.
- **`@catch` without a preceding `@try`/`@await`** is silently dropped by the
  parser (matches pre-existing `@then` behavior); no error is raised.
- **Hydration dual-branch walk.** When the server renders the catch branch and
  the client's try branch throws, the failed try-branch build advances the
  hydration cursor; `saveHydration`/`restoreHydration` rewind it before the
  catch branch hydrates. If the try branch throws *after* walking past real
  content (rather than before), the rewind may not fully restore the cursor.
