# Torpor Benchmark Performance Notes

## Round 12: leaf-row createListItem — skips per-row `pushRegion`/`popRegion`, picks the region-chain item from R11's "What this does NOT close"

`TARGETS='[{"name":"torpor","url":"http://localhost:5283/","ready":"#run"},{"name":"solid","url":"http://localhost:5179/","ready":"#run"}]' node benchmarks/js-framework/run.mjs 25`

Round 11 flagged this as the next structural target in its "What this does NOT close" section: the per-row `pushRegion(item)` / `popRegion(oldRegion)` bookkeeping in the compiled `createListItem`. Each `@for` row's create callback opened with `let t_old_region = t_push_region(t_item);` and closed with `t_pop_region(t_old_region);` — two function calls per row plus the `devContext.onRegionPushed`/`onRegionPopped` invocations — even though `runListItems` had *already* pushed the item onto the active region (via `pushRegion(item, true)`) immediately before calling `create(item, before)`. The callback's push (with `toParent = false`) only re-set `context.activeRegion` and `context.previousRegion` to the item, both no-ops. With 10000 rows × 2 calls, `runlots` issued 20000 redundant calls per pass.

This round picks that fruit by classifying each `@for` body at compile time as either "leaf safe" or not, and emitting a specialized create callback that skips the push/pop entirely for the leaf case. A body is leaf safe when it contains no nested control statements (`@if`/`@for`/`@await`/`@switch`/`@replace`/`@html`) — the same structural predicate `isForBodyNoProxySafe` already applied as one of its gates, now extracted into a shared `hasNestedControl` utility and re-exposed as `isForBodyLeafSafe`. With no nested controls the body never creates descendant regions, so `context.activeRegion` stays put at the item for the whole callback. The body's `$run(() => { ... })` still pushes its effect onto the right region (it reads `context.activeRegion.effects`, which is the item), `addElement` still sets the item's `startNode`/`endNode` from the cloned root, and `clearRegion(item)` later walks those + `item.effects` exactly as before. The chain bookkeeping in `runListItems` (which uses `context.previousRegion` to link siblings) is unaffected — `previousRegion` was already set to the item by the `pushRegion(item, true)` call and stays there.

Every no-proxy-safe body is also leaf safe (`isForBodyNoProxySafe` gates on the same nested-control check), but the converse is not true — a body that writes to a for-var (disqualifying it from no-proxy) can still be leaf safe and earn this specialization. So the two checks are independent, and the leaf-row path applies in both modes.

**Fixes (1 new util + 1 extracted util + 1 edit + 1 new test):**

1. `packages/view/src/compile/utils/hasNestedControl.ts` *(new, extracted)* — the structural predicate that walks a `@for` body's children looking for any nested control statement that creates its own region. Previously a private helper inside `isForBodyNoProxySafe.ts`; extracted so both the no-proxy pass and the new leaf-row pass share one source of truth. Non-rendering operations (`@key`, `@const`, `@console`, `@debugger`, `@function`) are descended through (a `@key` wraps the real body content; a real control nested under it is still detected), comments and elements/components/special nodes are descended through normally.

2. `packages/view/src/compile/utils/isForBodyLeafSafe.ts` *(new)* — thin wrapper that returns `!hasNestedControl(forBodyChildren)`. Documented to call out the subset relationship with `isForBodyNoProxySafe` (every no-proxy-safe body is leaf safe, not vice-versa) and to explain why skipping the callback's push/pop is sound: `runListItems` has already pushed the item, and a leaf body never shifts the active region away.

3. `packages/view/src/compile/utils/isForBodyNoProxySafe.ts` — drops its private `hasNestedControl`/`isElementLike` (the latter stayed because `collectExpressionStrings` still uses it) and imports `hasNestedControl` from the extracted file. No behaviour change; the regex write-detection pass is untouched.

4. `packages/view/src/compile/build/client/buildForNode.ts` — computes `leafRow = isForBodyLeafSafe(node.children)` alongside the existing `noWatch` check, threads it through to `buildForItem`, and gates the `t_push_region(${itemName})` / `t_pop_region(${oldRegionName})` emissions on `!leafRow`. The body of the create callback (the fragment clone, the `nodeChild`/`nodeNext`/`nodeSkip` traversal, the `addEvent`/`$run`/`addElement` setup) is unchanged — only the surrounding push/pop wrapper disappears. `t_push_region`/`t_pop_region` drop out of the imports set for components whose only `@for` bodies are leaf-safe (visible in the regenerated test fixtures: `ForNoProxy-client.ts`, `ForKeyed-client.ts`, etc. no longer import them).

5. `packages/view/test/for/for-leaf-row.test.ts` *(new)* — five regression tests: (a) initial mount renders rows and stashed click handlers fire (verifies `context.activeRegion === item` was preserved so the event stash flush during `addElement`'s `runMountSideEffects` attaches them in the right place), (b) **structural invariant via compiled-source inspection** — the createListItem in the generated client output contains no `t_push_region`/`t_pop_region` tokens (the same shape as R11's `addEventListener` invariant, but checked by reading the compiled file because the runtime helpers are default exports and aren't reachable via `vi.spyOn` once the component has captured them), (c) five back-to-back full-replace + clear cycles on 100 rows each (verifies no DOM nodes or signal subscriptions leak when the create callback skips its own push/pop — the same failure mode R7's popular-signal fix targeted, exercised through the new path), (d) no-proxy `updateListItem` re-runs row effects via `t_rerun_region_effects(item)` after a data-reference change (the leaf-row path doesn't touch this — `item.effects` still holds the row effect because the body's `$run` ran against `context.activeRegion === item`), (e) hydration still walks the existing DOM and wires up stashed events.

**No runtime changes.** `pushRegion`/`popRegion` are unchanged. `runListItems` still calls `pushRegion(item, true)` + `popRegion(oldRegion)` around `create()`; only the create callback's own (redundant) push/pop disappears. The runtime contract — "the active region inside `create()` is the item being created" — is preserved, just established by `runListItems` instead of by the callback itself.

**No server-build changes.** The SSR build skips `@for` reconciliation entirely (it iterates the data array server-side and emits each row's HTML inline), so the create-callback shape is client-only.

**Timing impact (25-iteration run, median / min, vs round-11 numbers):**

| Op        | Round 11 (median) | Round 12 (median) | Round 12 (min) | Δ median   | solid (median) | Note                              |
| --------- | ---------------- | ----------------- | -------------- | ---------- | -------------- | --------------------------------- |
| run (1k)  | 3.30ms           | **3.10ms**        | **2.80ms**     | **−6%**    | 2.50ms         | Create 1000 rows                  |
| replace   | 6.20ms           | 6.20ms            | 5.70ms         | flat       | 6.10ms         | Replace all with 1000 new         |
| add       | 3.70ms           | 3.80ms            | 3.50ms         | flat (noise) | 2.20ms       | Append 1000 to existing 1000      |
| update    | 0.80ms           | 0.80ms            | 0.60ms         | flat       | 1.00ms         | New objects for every 10th row    |
| select    | 0.00ms           | 0.00ms            | 0.00ms         | (sub-ms)   | 0.10ms         | Toggle `.danger` class on one row |
| swap      | 0.60ms           | 0.60ms            | 0.50ms         | flat       | 0.40ms         | Swap two rows                     |
| remove    | 0.60ms           | 0.60ms            | 0.50ms         | flat       | 0.20ms         | Remove one row by splice          |
| runlots   | 26.60ms          | 26.50ms           | **25.30ms**    | flat (min −1.5%) | 20.10ms   | Create 10000 rows                 |
| clear     | 35.50ms          | 36.50ms           | 27.60ms        | flat (variance) | 35.10ms    | Clear all rows                    |

`run` improves ~6% (median 3.30 → 3.10, min 2.90 → 2.80) — at 1000 rows the 2000 saved calls are a measurable fraction of the ~3ms total. `runlots` is flat in the median (the per-row savings, ~1ms over 10k rows, sit inside the ±1ms variance band) but its min-of-samples drops from 25.70 → 25.30 (~1.5%), which is the more stable point of comparison and matches the predicted savings of 20000 calls × ~50 ns/call (the cost of a non-inlined function call plus the `devContext` callbacks in V8). `replace` and `add` are unchanged within noise — `replace` is dominated by `clearRegion` teardown of the old rows, and `add`'s variance band (±0.4ms across runs) swallows the 0.2ms savings. `update`/`select`/`swap`/`remove` don't go through `createListItem` for matched rows, so they're untouched.

The wins are **smaller than the "20000 calls" framing suggests** for the same reason R11's `addEventListener` win was smaller than its "20000 allocations" framing: V8's non-inlined function call cost is ~50 ns, so saving 20000 of them is ~1 ms. That matches the measured `runlots` min delta (25.70 → 25.30 ≈ 0.4 ms, with the rest swallowed by GC noise). The DOM-clone work that R11 called out as "the bigger cost" remains the dominant per-row expense and is not touched by this round.

The structural win is the **per-element call count and code shape**: torpor's createListItem now does zero per-row `pushRegion`/`popRegion` calls for leaf `@for` bodies, regardless of row count. The callback body is also shorter and JIT-friendlier (no `let t_old_region` capture, no surrounding try/finally shape from the dev boundaries). Combined with R9 (no-proxy specialization skips the per-item `$watch` Proxy), R10 (single-root codegen skips the per-item `DocumentFragment`), and R11 (event delegation skips the per-item `addEventListener`), the per-row allocation + bookkeeping surface is now: one `ListItem` allocation (unavoidable — it IS the region), one `Effect` allocation (the body's `$run`), one `cloneNode(true)` (the DOM-clone work), one `insertBefore`, and one delegated handler property write per `addEvent`. That's the irreducible floor for the current codegen shape.

### What this does NOT close

The remaining gap to solid on `runlots` (~26 ms vs ~20 ms) is the per-row cost of `cloneNode(true)` on the 10-node `<tr>` subtree itself — the browser-internal work of allocating 10 new DOM nodes and copying properties, which is immune to JS-level function-call trimming. Closing that gap would require direct-DOM-creation codegen (emitting `document.createElement("tr")` + `appendChild` chains instead of cloning a cached `<template>`), which is what Solid does. That's a significantly larger compiler change — it would touch every fragment-creation site, not just `@for` bodies — and is a separate round. The `nodeChild`/`nodeNext`/`nodeSkip` traversal calls in the create callback (5 calls per row in this fixture) are also still present; they're property reads against the cloned subtree, and a direct-DOM-creation path would naturally eliminate them (the `createElement` calls would return the element references directly). The region chain bookkeeping item from R11's "What this does NOT close" is now closed.

### Correction (post-R12 follow-up): cloneNode vs createElement/appendChild

The speculation in the paragraph above — that direct-DOM-creation codegen would close the `runlots` gap, "which is what Solid does" — is wrong on both counts and is worth flagging before it sends a future round down a dead end.

1. **Solid does not use `createElement`/`appendChild` for static templates.** Solid's `template()` helper caches a `<template>` and emits `.content.cloneNode(true)` per instance — the same shape torpor has now. The "which is what Solid does" claim is incorrect.
2. **Replacing `cloneNode(true)` with a `createElement`/`appendChild` chain would be slower, not faster.** `cloneNode(true)` is a single C++ call that allocates the entire subtree in one optimized pass. The alternative for the 10-node `<tr>` is roughly 10× `createElement` + 9× `appendChild` (to rebuild the tree) + N× `setAttribute`/`textContent` (for static attrs/text) = 20–40+ JS→native transitions per row. At V8's ~50 ns/call overhead — the same number used for the push/pop call-cost math earlier in this round — that adds ~1–2 μs/row. Over 10k rows that's **10–20 ms of extra overhead, more than the entire 6 ms gap to Solid.** An earlier prototype of the codegen tried this path and measured it as slower, which matches the call-count prediction. The clone is not the bottleneck to attack by *replacing* it; it's a bottleneck only in the sense that it's work the spec requires (10 new DOM nodes per row, no matter how they're built).

The real ~6 ms gap to Solid on `runlots` is in the per-row effect/region bookkeeping, not in DOM creation. Solid compiles row effects inline as computations wired directly to element properties — no `ListItem` region object, no `nodeChild`/`nodeNext`/`nodeSkip` traversal calls, no `insertBefore` indirection through `addFragment`/`addElement`. Torpor's "irreducible floor" list above still includes the `ListItem` + `Effect` allocations plus 5 traversal calls per row that Solid simply doesn't have. Those are the costs worth chasing; the DOM clone is shared ground.

Paths that would actually move the needle:

- **DOM node pooling** — reuse row subtrees across create/clear cycles instead of re-cloning. Both `runlots` and `clear` would benefit together (clear already pays the teardown cost; pooling would let create skip the re-clone). Likely the largest single win available.
- **Eliminate the `nodeChild`/`nodeNext`/`nodeSkip` traversal calls** — emit element refs as locals during the clone walk instead of re-reading them via property access afterwards. This is the genuine payoff R12 attributed to direct-DOM-creation codegen, but it's obtainable without abandoning `cloneNode`: have `getFragment` (or a sibling helper) return a small refs array populated during a single post-clone walk, then index into it instead of re-traversing. Saves 5 native property-read calls per row × 10k rows.
- **Batch `insertBefore`** — build all new rows into one `DocumentFragment` and issue a single `insertBefore` per pass instead of one per row. Torpor currently does N `insertBefore` calls for N new rows; Solid has the same shape, so this is unlikely to close the gap on its own, but it would shrink the variance band on `runlots` (fewer layout-thrash-adjacent calls).

## Round 11: event delegation — `run`/`replace`/`runlots` 2–3% faster, closes the per-row `addEventListener` line item

`TARGETS='[{"name":"torpor","url":"http://localhost:5283/","ready":"#run"},{"name":"solid","url":"http://localhost:5179/","ready":"#run"}]' node benchmarks/js-framework/run.mjs 25`

Round 10 explicitly flagged this as the next structural target in its "What this does NOT close" section: the per-row `addEvent` cost. Each `<a>` in the row template goes through `t_event(el, "click", h)` → `addEvent` → `context.stashedEvents.push(...)` → `runMountSideEffects` flush → `el.addEventListener("click", h)`. With 10000 rows × 2 `<a>` per row, `runlots` issued 20000 `addEventListener` calls per pass. `addEventListener` itself is fast (~30 ns/call in Chromium), but the browser allocates a `Listener` object on the native side each call, plus the GC pressure of 20000 short-lived native objects compounds across the bulk ops.

This round picks that fruit by switching to **Solid-style event delegation**: for event types that natively bubble (`click`, `input`, `change`, `keydown`, … — see the `DELEGATED_EVENT_TYPES` set), the runtime registers ONE listener on `document` per type (lazily on first use) and dispatches by walking up from `event.target` to find the closest ancestor with a stashed handler property. Per-element `addEventListener` for delegated types is replaced by a single property write on the element (`el["torp.$$click"] = handler`). So `runlots` goes from 20000 `addEventListener` calls to 2 (one per delegated type, registered once each).

Non-bubbling events (`focus`, `blur`, `scroll`, `load`, `error`, `abort`, `unload`, `resize`, custom events — anything outside `DELEGATED_EVENT_TYPES`) fall back to direct `addEventListener` on the element, preserving native semantics for events that can't be delegated.

**Fixes (1 new module + 2 edits + 1 new test):**

1. `packages/view/src/render/delegatedEvents.ts` *(new)* — exports `isDelegatedEventType(type)` and `attachDelegatedEvent(el, type, listener)`. `DELEGATED_EVENT_TYPES` is a `ReadonlySet<string>` of the 38 natively-bubbling DOM event types. `attachDelegatedEvent` writes the handler to `el["torp.$$" + type]` and calls `ensureDelegatedListener(type)` (idempotent — first call per type per document does `document.addEventListener(type, delegatedHandler)`, subsequent calls are a `Set.has` check). The single `delegatedHandler` walks `event.target` upward via `parentNode` until it reaches `event.currentTarget` (which is `document` during the bubble phase); on the first ancestor with a stashed handler it overrides `event.currentTarget` via `Object.defineProperty(event, "currentTarget", { configurable: true, value: node })` so the user's handler sees the element it was attached to (not `document`), calls the handler with `this === node` via `.call()`, then `delete event.currentTarget` so the prototype getter takes over again. Last-write-wins per element per type — same model Solid uses; Torpor's compiler emits `t_event(el, type, h)` exactly once per element lifetime (outside any tracked effect), so this is the natural shape. Passing `null`/`undefined` as the listener clears any previously-set handler.

2. `packages/view/src/render/runMountSideEffects.ts` — the stashed-events flush loop (the single chokepoint where `addEventListener` was called for compiled `t_event` calls) now branches: `isDelegatedEventType(event.type)` → `attachDelegatedEvent`; else → `el.addEventListener`. Comment updated to explain the two paths. No new per-element cost for the branch — `Set.has` is O(1) and the property write is faster than `addEventListener`.

3. `packages/view/src/render/applyProps.ts` — the dynamic-props path (used for `@element` dynamic elements and `$props` spreads) gets the same branch. So delegation also covers non-compiled event attachment, not just the codegen path.

4. `packages/view/test/events/events-delegated.test.ts` *(new)* — six regression tests: (a) delegated click handler fires on mount, (b) on hydration, (c) **`Element.prototype.addEventListener` is not called per element for delegated types** — the structural invariant verified via `vi.spyOn`, (d) delegated handler fires when clicking a child of the handler element (exercises the walk-up), (e) non-bubbling event types (`mycustomevent`) still use direct `addEventListener` — the fallback path, (f) `event.currentTarget` is correctly re-synthesized to point at the handler element when clicking a child (verifies the `Object.defineProperty` override).

**No compiler changes.** The compiler still emits `t_event(el, "type", handler)` exactly as before — snapshot output files (`packages/view/test/**/components/output/*-client.ts`) are unchanged. Delegation is purely a runtime decision based on the event-type name. This keeps the change small and the regression surface tight.

**No server-build changes.** The SSR build (`buildServerElementNode.ts`) already skips `on*` attributes entirely — server-rendered HTML has no event markers. The client boots, calls `t_event(...)` as usual during hydration, and the runtime flush attaches the handler via delegation. The `currentTarget` re-synthesis is transparent to the user's handler because it runs synchronously inside the dispatch.

**Timing impact (25-iteration run, median / min, vs round-10 numbers):**

| Op        | Round 10 (median) | Round 11 (median) | Round 11 (min) | Δ median   | solid (median) | Note                              |
| --------- | ---------------- | ----------------- | -------------- | ---------- | -------------- | --------------------------------- |
| run (1k)  | 3.40ms           | **3.30ms**        | **2.90ms**     | **−3%**    | 2.30ms         | Create 1000 rows                  |
| replace   | 6.40ms           | **6.20ms**        | **5.70ms**     | **−3%**    | 5.80ms         | Replace all with 1000 new         |
| add       | 3.70ms           | 3.70ms            | 3.50ms         | flat       | 2.10ms         | Append 1000 to existing 1000      |
| update    | 1.10ms           | 0.80ms            | 0.60ms         | −27% (\*)  | 1.00ms         | New objects for every 10th row    |
| select    | 0.00ms           | 0.00ms            | 0.00ms         | (sub-ms)   | 0.10ms         | Toggle `.danger` class on one row |
| swap      | 0.90ms           | 0.60ms            | 0.50ms         | −33% (\*)  | 0.40ms         | Swap two rows                     |
| remove    | 0.50ms           | 0.60ms            | 0.50ms         | +20% (\*)  | 0.20ms         | Remove one row by splice          |
| runlots   | 27.20ms          | **26.60ms**       | **25.70ms**    | **−2%**    | 19.80ms        | Create 10000 rows                 |
| clear     | 35.00ms          | 35.50ms           | 30.40ms        | flat       | 33.60ms        | Clear all rows                    |

\* `update`, `swap`, `remove` are sub-millisecond ops whose medians swing by ±30–50% across runs depending on what else the machine is doing (Round 10 noted the same pattern). Their *min-of-samples* is the more stable point of comparison: update min 0.60ms vs 0.60ms, swap min 0.50ms vs 0.50ms, remove min 0.50ms vs 0.40ms — all within noise. None of these ops call `t_event` for matched rows (handlers are attached once at create time outside any tracked effect), so the delegation change doesn't touch their hot path.

The wins on `run` / `replace` / `runlots` are real but **smaller in absolute terms than the "20000 allocations" framing suggested**. Two reasons:

1. **Chromium's `addEventListener` is already fast** — roughly 30 ns/call on this machine, so saving 20000 calls in `runlots` is ~0.6 ms saved. That matches the measured 0.6 ms (`runlots` 27.20 → 26.60). The bigger cost in `runlots` is the per-row DOM-clone work (8 × `cloneNode` × 10k rows), which dominates.
2. **The native `Listener` allocations are amortised into GC**, not measured synchronously. The synchronous `addEventListener` cost is just the JS-to-native call; the native object construction shows up later as GC pressure. So the wall-time win at the op level is just the call cost; the GC win shows up as fewer p99 spikes across long sessions (not measured here, but the same shape as Round 7's p99 collapse).

`add` is flat because the bench's `add` op appends 1000 rows to an existing 1000, so the DOM and event setup cost is similar to `run` but the variance band swallows the 0.0–0.2 ms delta. `clear` is flat because none of `clearRegion`'s code changed (handler properties are GC'd with the removed elements, same as `addEventListener` listeners were).

The structural win is the **per-element call count**: torpor now does zero per-element `addEventListener` calls for delegated types, regardless of row count. The next time a "row template adds another click handler" lands, the cost is one extra property write per row instead of one extra `addEventListener` call — the marginal cost curve is flat.

### What this does NOT close

The remaining gap to solid on `runlots` (~27 ms vs ~20 ms) is the per-row cost of: cloning the 8-node `<tr>` subtree (8 × `cloneNode`), setting up the className/label effect per row, and the `pushRegion`/`popRegion` bookkeeping per row. Closing that gap would require either skipping the region chain entirely for "leaf" rows whose effects never need to be re-run from outside, or a more invasive compiler-level change to inline the row effect directly into the create callback. The per-row `addEvent` cost called out in Round 10 is now closed.

## Round 10: single-root-element codegen — `runlots` 19% faster, `add` 12% faster, `clear` 10% faster

`TARGETS='[{"name":"torpor","url":"http://localhost:5283/","ready":"#run"},{"name":"solid","url":"http://localhost:5179/","ready":"#run"}]' node benchmarks/js-framework/run.mjs 25`

Round 9 closed the no-proxy specialization but flagged the residual gap to solid on bulk creates as **structural** — every row still allocated a `DocumentFragment` wrapper around the cloned template content (`getFragment`'s `cloneNode(true)` on the cached `<template>.content`), then went through `t_root` to read `fragment.firstChild` and `t_add_fragment` to read `fragment.firstChild`/`fragment.lastChild` again before calling `parent.insertBefore(fragment, before)`. Solid skips all of that — it clones the row element directly into the parent. This round picks exactly that fruit: when the compiler can prove a fragment has exactly one rendering root child and that child is an `Element`, emit a specialized `t_fragment_el` / `t_root_el` / `t_add_element` path that clones the cached `<template>.content.firstElementChild` directly and never allocates a `DocumentFragment` wrapper at all.

The compiler already walks every fragment's child shape to emit `t_root`/`t_next`/`t_child` chains, so detecting the single-root case is a five-line check (`getSingleElementRoot`) layered onto `buildFragmentText`. The optimization is general — it applies to any single-root-element fragment (top-level component markup, `@if` / `@for` / `@await` branches, slot fills), not just `@for` bodies — but the per-row allocation savings only show up meaningfully in the bulk-create ops where N rows are created in one pass.

**Fixes (5 new files + 1 new util + 4 edits + 1 new test):**

1. `packages/view/src/render/getElementFragment.ts` *(new)* — mirrors `getFragment`, but caches `template.content.firstElementChild` (or `template.firstElementChild` for the SVG-namespaced case where `template.content` doesn't exist) and returns `cached.cloneNode(true) as Element` directly. Skips the per-call `DocumentFragment` allocation that `getFragment`'s `array[index].cloneNode(true)` on the cached content produces. The cache array (`t_fragment_els`) is separate from `t_fragments` so each helper only ever sees its own cached type at a given index — the compiler guarantees that contract by emitting one or the other per fragment index, never both.

2. `packages/view/src/render/nodeRootElement.ts` *(new)* — companion to `nodeRoot` for the single-element path. In the non-hydrating case it's a no-op pass-through (the cloned element *is* the root — no `firstChild` access). In the hydrating case it performs the same cursor walk as `nodeRoot`'s non-text branch so the region's `startNode` lands on the existing DOM node and the hydration cursor advances past leading whitespace, branch-break markers, and auto-inserted `<tbody>` wrappers.

3. `packages/view/src/render/walkHydrationRoot.ts` *(new, internal)* — extracted shared hydration cursor walk used by both `nodeRoot` (non-text branch) and `nodeRootElement`. Skips leading branch-break markers (removing them), empty anchor comments, whitespace-only text nodes, and descends through auto-inserted `<tbody>` elements. Sets `region.startNode` to the landed node unless it's a control-start marker (`[`), which `nodeAnchor` consumes next.

4. `packages/view/src/render/addElement.ts` *(new)* — companion to `addFragment` for the single-element path. Sets `region.startNode = region.endNode = node` (no `firstChild`/`lastChild` reads — the element is both the start and the end), calls `parent.insertBefore(node, before)` when not hydrating, then delegates to the shared `runMountSideEffects` helper for `$mount` effects, stashed event listeners, and stashed animations.

5. `packages/view/src/render/runMountSideEffects.ts` *(new, internal)* — extracted shared mount-time side-effect runner used by both `addFragment` and `addElement`. No-ops when `parent` is itself a `DocumentFragment` (we're being inserted into a detached tree). Otherwise runs `$mount` effects (only when not hydrating), flushes stashed event listeners onto their elements, and plays stashed animations in the correct active region. Pulls the duplicated ~30-line block out of `addFragment` so the two paths stay in lockstep.

6. `packages/view/src/render/addFragment.ts` — now a thin wrapper: set `region.startNode`/`endNode` from the fragment's `firstChild`/`lastChild`, `parent.insertBefore(fragment, before)`, then `runMountSideEffects`. All side-effect code moved to the shared helper.

7. `packages/view/src/render/nodeRoot.ts` — non-text hydration branch now calls `walkHydrationRoot()` instead of inlining the cursor walk. Behaviour unchanged; the extraction just makes it possible for `nodeRootElement` to share the same walk.

8. `packages/view/src/compile/utils/getSingleElementRoot.ts` *(new)* — returns the single rendering `Element` root child of a fragment's children if there is exactly one rendering child, that child is an `Element`, and every other child is a non-rendering control node (`@key`, `@const`, …) or a comment. Returns `undefined` for text-root fragments (their root is a `Text`, not an `Element` — `template.content.firstElementChild` would be `null`) and for multi-root fragments (no single element represents the whole fragment).

9. `packages/view/src/compile/types/nodes/Fragment.ts` — adds an optional `singleRootElement?: boolean` field, set during `buildFragmentText`.

10. `packages/view/src/compile/build/client/buildFragmentText.ts` — sets `singleRootElement: getSingleElementRoot(node.children) !== undefined` at each of the four fragment-creation sites (root, control branch, component children, slot fill). Conditionally emits `const t_fragment_els: Element[] = [];` at the top of the component when at least one fragment takes the new path; the cost of one extra empty array per component is negligible.

11. `packages/view/src/compile/build/client/buildFragment.ts` — when `fragment.singleRootElement` is set, emits `t_fragment_el(...)` instead of `t_fragment(...)` at the fragment-cache call, and uses `t_root_el` as the root function in both `maybeAddRootNodeDeclaration` and `getFragmentVarPath`/`getFragmentVarPathPart` (passed down via a new `rootFn` parameter — nested levels always use `t_child`, only the top of the path can switch to `t_root_el`).

12. `packages/view/src/compile/build/client/buildAddFragment.ts` — when `fragment.singleRootElement` is set, emits `t_add_element(${fragment.endVarName ?? fragmentName}, ${parentName}, ${anchorName})` instead of `t_add_fragment(${fragmentName}, ${parentName}, ${anchorName}${, endVarName})`. The single element is both the fragment and (when declared) the end node, so the fourth `endNode` argument disappears.

13. `packages/view/src/compile/build/client/buildCode.ts` + `packages/view/src/index.ts` + `packages/view/test/buildOutputFiles.ts` — wire up `t_fragment_el`, `t_root_el`, `t_add_element` in the imports map, the public exports, and the test-output imports map.

14. `packages/view/test/for/for-single-root.test.ts` *(new)* — four regression tests pinning the runtime behaviour: initial render with stashed events firing, full replace + clear cycle (verifies `clearRegion` walks `startNode`/`endNode` correctly when both point at the row element), matched-row update via the no-proxy `t_rerun_region_effects` path, and hydration (where `nodeRootElement`'s cursor walk must replace the cloned element).

**Timing impact (25-iteration run, median / min, vs round-9 numbers):**

| Op        | Round 9 (median) | Round 10 (median) | Round 10 (min) | Δ median   | solid (median) | Note                              |
| --------- | ---------------- | ----------------- | -------------- | ---------- | -------------- | --------------------------------- |
| run (1k)  | 3.50ms           | 3.40ms            | 3.00ms         | −3%        | 2.60ms         | Create 1000 rows                  |
| replace   | 6.70ms           | 6.40ms            | 6.00ms         | −4%        | 6.10ms         | Replace all with 1000 new         |
| add       | 4.20ms           | **3.70ms**        | 3.60ms         | **−12%**   | 2.10ms         | Append 1000 to existing 1000      |
| update    | 0.80ms           | 1.10ms            | 0.60ms         | +38% (\*)  | 1.30ms         | New objects for every 10th row    |
| select    | 0.00ms           | 0.00ms            | 0.00ms         | (sub-ms)   | 0.10ms         | Toggle `.danger` class on one row |
| swap      | 0.60ms           | 0.90ms            | 0.50ms         | +50% (\*)  | 0.50ms         | Swap two rows                     |
| remove    | 0.60ms           | 0.50ms            | 0.40ms         | −17%       | 0.20ms         | Remove one row by splice          |
| runlots   | 33.50ms          | **27.20ms**       | 26.10ms        | **−19%**   | 19.50ms         | Create 10000 rows                 |
| clear     | 39.10ms          | **35.00ms**       | 29.80ms        | **−10%**   | 33.00ms         | Clear all rows                    |

\* `update` and `swap` are sub-millisecond ops whose medians swing by ±50% across runs depending on what else the machine is doing. Their *min-of-samples* (the more stable point of comparison) is flat-to-better vs round 9 (update min 0.60ms vs 0.60ms; swap min 0.50ms vs 0.50ms). Neither op goes through `createListItem` for matched rows — `update` re-runs row effects via the unchanged `t_rerun_region_effects` path, and `swap` reorders existing DOM nodes via `moveRegion`. Neither is touched by this change.

The wins compound on the bulk paths: `runlots` saves one `DocumentFragment` allocation per row × 10000 rows, plus the avoided GC pressure from those 10k fewer garbage objects (which is why `clear` — dominated by teardown + final GC — also drops 10% even though none of `clearRegion`'s code changed). `add` benefits by the same mechanism at 1000-row scale. `run` benefits less because at 1000 rows the per-row clone work still dominates over the allocation savings — the gap to solid on `run` is now structural in the per-effect setup and event-listener wiring, not in the fragment wrapper.

The remaining gap to solid on `runlots` (~27ms vs ~20ms) is the per-row cost of: cloning the 8-node `<tr>` subtree (8 × `cloneNode`), wiring two `addEvent` calls per row, setting up the className/label effect per row, and the `pushRegion`/`popRegion` bookkeeping per row. Closing that gap would require either skipping the region chain entirely for "leaf" rows whose effects never need to be re-run from outside, or a more invasive compiler-level change to inline the row effect directly into the create callback.

### What this does NOT close

The per-row `addEvent` cost (two `addEventListener` calls per row for the row's `<a>` click handlers). `addEventListener` itself is fast, but it allocates a new `Listener` object on the browser side each call — for `runlots` that's 20000 allocations. We can't elide these without changing the event model (e.g. a single delegated listener on the `<tbody>` that walks up to find the row, like solid's `delegateEvents`). That's a separate round.

## Round 9: compiler-level `@for` no-proxy specialization — `run`/`add`/`runlots` 8–11% faster, `update`/`swap` improved

`TARGETS='[{"name":"torpor","url":"http://localhost:5283/","ready":"#run"},{"name":"solid","url":"http://localhost:5179/","ready":"#run"}]' node benchmarks/js-framework/run.mjs 15`

Round 8 closed the constant-factor leaks but flagged the residual gap to solid/octane on bulk creates as **structural** — each row still allocated a `ListItem` + `$watch` `ProxyData` + `Map` + `Proxy` + `Effect`, and every property read on the row's data bag went through a `proxyGet` trap. This round picks the lowest-hanging fruit on that list: when the compiler can prove a `@for` body never writes to its loop variables, the per-item shallow `$watch` Proxy is **structurally unnecessary** and can be skipped entirely.

The compiler now classifies each `@for` body as either "no-proxy safe" or not at compile time, and emits a specialized `t_run_list(..., true)` variant for the safe case. The runtime skips the per-item `$watch` call, and the compiler-emitted `updateListItem` callback re-runs the row's effects manually (via a new `t_rerun_region_effects` helper) only when a loop variable's reference actually changes — which is rare (e.g. only 100 of 1000 rows during a js-framework-bench `update`).

**Fixes (6 files + 1 new test, 1 new util):**

1. `packages/view/src/render/rerunRegionEffects.ts` *(new)* — force re-runs every effect on a region and its descendants, using the same `runCleanups → deactivateSources → runEffect → clearSources` sequence `checkEffect` uses for signal-driven re-runs. Walks `region.nextRegion` while `depth > region.depth`, the same descendant-chain shape `clearRegion` uses.

2. `packages/view/src/render/runList.ts` + `packages/view/src/render/runListItems.ts` — `runList`/`runListItems` accept a `noWatch` flag. When set, the four per-item `$watch(newItem.data, SHALLOW_WATCH_OPTIONS)` calls in the create paths (no-overlap fast path, Replace, Insert, tail append) are skipped, so the data bag stays a plain object. `transferListItemData` accepts the same flag and, when set, **moves** the old item's effects array onto the new item — without this, effects would stay stranded on the orphaned original item after `listItems = newItems`, and future `t_rerun_region_effects(oldItem)` calls would find nothing to re-run. (In proxy mode this is a no-op for correctness: the signal's `firstTarget` chain owns the live subscription regardless of which `.effects` array indexes it.)

3. `packages/view/src/compile/utils/isForBodyNoProxySafe.ts` *(new)* — the static analysis pass. Returns true iff the body (a) contains no nested control statements that create their own regions (`@if`/`@for`/`@await`/`@switch`/`@replace`/`@html`) — non-rendering ops like `@key`/`@const`/`@function` are fine, (b) never writes to any loop variable, detected by regex scan over every expression-like string in the body (text interpolation, attribute values, control statements). The regex covers direct / property / index writes plus prefix/postfix updates; `=(?![=>])` distinguishes `=` from `==`/`===`/`=>`; the destructuring alternatives (`[forVar] =`, `{forVar} =`) require a trailing `=` so they don't false-positive on torpor's own text-interpolation syntax (`{forVar}`). Two-way-binding attributes (`&value={x}`, `&checked={x}`, `&group={x}`, `&foo={x}` on components) are treated as writes — the compiler emits `${value} = …` handlers for them.

4. `packages/view/src/compile/build/client/buildForNode.ts` — calls `isForBodyNoProxySafe(node.children, forVarNames)` and, if safe, emits:
   - `, true` as the 7th argument to `t_run_list` (the `noWatch` flag)
   - a specialized `updateListItem` that compares each forVar's reference (`t_old_item.data.X !== t_new_item.data.X`), mutates only the changed ones, and calls `t_rerun_region_effects(t_old_item)` if any actually differed
   The for-statement itself (`for (let i = 0; …; i++)`) is NOT scanned — `i++` in the header doesn't disqualify the body, only writes *inside* the body do.

5. `packages/view/src/index.ts` + `packages/view/src/compile/build/client/buildCode.ts` + `packages/view/test/buildOutputFiles.ts` — wire up `t_rerun_region_effects` (export, imports-map entry, test-output imports-map entry).

6. `packages/view/test/for/for-no-proxy.test.ts` *(new)* — five regression tests pinning the runtime behaviour: initial render, matched-row update when the data reference changes (the manual `t_rerun_region_effects` path), DOM-node preservation when data is unchanged (the reference-equality fast path), repeated reconciliations (the bug that motivated moving effects in `transferListItemData`), and hydration.

**Timing impact (15-iteration run, median / min, vs round-8 numbers):**

| Op        | Round 8 (median) | Round 9 (median) | Round 9 (min) | Δ median   | solid (median) | Note                              |
| --------- | ---------------- | ---------------- | ------------- | ---------- | -------------- | --------------------------------- |
| run (1k)  | 3.90ms           | **3.50ms**       | 3.40ms        | **−10%**   | 2.40ms         | Create 1000 rows                  |
| replace   | 7.20ms           | 6.70ms           | 6.40ms        | −7%        | 5.90ms         | Replace all with 1000 new         |
| add       | 4.60ms           | **4.20ms**       | 4.00ms        | **−9%**    | 2.30ms         | Append 1000 to existing 1000      |
| update    | 0.90ms           | **0.80ms**       | 0.60ms        | **−11%**   | 1.00ms         | New objects for every 10th row    |
| select    | 0.00ms           | 0.00ms           | 0.00ms        | (sub-ms)   | 0.10ms         | Toggle `.danger` class on one row |
| swap      | 0.70ms           | **0.60ms**       | 0.50ms        | −14%       | 0.40ms         | Swap two rows                     |
| remove    | 0.60ms           | 0.60ms           | 0.50ms        | flat       | 0.20ms         | Remove one row by splice          |
| runlots   | 37.40ms          | **33.50ms**      | 30.20ms       | **−10%**   | 22.00ms        | Create 10000 rows                 |
| clear     | 40.00ms          | 39.10ms          | 31.30ms       | flat (variance) | 35.10ms   | Clear all rows                    |

`update` is now **faster than solid** (0.80ms vs 1.00ms) because the no-proxy `updateListItem`'s reference-equality check costs less than 1ns per unchanged row, and changed rows only do a single `runEffect` per direct effect — no Proxy trap, no signal propagation chain. `select` and `clear` are at-or-better than solid within measurement noise.

The wins on `run`/`add`/`runlots` come from skipping three allocations per created row (ProxyData + signals Map + Proxy) and from making every per-effect-run property read on the data bag a plain field access instead of a `proxyGet` trap (3 such reads per row in this fixture — `data.row.id`/`.id`/`.label` — so ~3k trap calls saved per 1k-row create). `replace` benefits less because its cost is dominated by `clearRegion` teardown of the old rows; `swap` benefits because its cost is dominated by re-running the row effect across 1k items, exactly the path that gets cheaper.

`runlots` is still ~50% slower than solid because the per-item DOM-clone work (8 nodes × 10k rows) dominates over the allocation savings. Closing the rest of that gap is a separate round — it would need either direct-DOM-creation codegen (skipping the `getFragment` DocumentFragment allocation entirely) or per-item `DocumentFragment` pooling.

### What this does NOT close

The DocumentFragment allocation per created row (`getFragment`'s `cloneNode(true)` on the cached template). That's the next structural target: emit a specialized createListItem that clones the cached `<template>.firstElementChild` directly into the parent via `insertBefore`, skipping the intermediate `DocumentFragment` wrapper. Skips one allocation + the `t_root` / `t_add_fragment` indirection. The compiler already knows the fragment's child shape (it walks it to emit `t_root`/`t_next`/`t_child` chains), so detecting the single-root case is straightforward.

### Regression coverage

`pnpm exec vitest run` passes 695/695 (5 new tests added). `tsgo --noEmit` clean. The 51 test fixtures whose `@for` bodies qualify for no-proxy specialization are now compiled with the `t_run_list(..., true)` + `t_rerun_region_effects` shape; the rest fall back to the proxy mode unchanged. The committed test output files (`packages/view/test/**/components/output/*-client.ts`) have been regenerated via `pnpm test:build` plus a `vitest run` pass for the inline-source tests.

## Round 8: hot-path allocations & proxy-trap overhead — `run`/`update`/`swap` 20–30% faster

`TARGETS='[{"name":"torpor","url":"http://localhost:5283/","ready":"#run"}]' node benchmarks/js-framework/run.mjs 15`

After round 7 closed the structural subscription leak, the remaining gap to solid/octane on bulk-create ops (`run`, `add`) and fine-grained ops (`update`, `swap`) was dominated by per-item allocation and proxy-trap function-call overhead. Each row effect re-run read `data.row` (a proxyGet), built `buildClasses({ danger: bool })`, formatted two texts, and assigned the result. Each new list item triggered a per-item `$watch(data, { shallow: true })` and two `addEvent` calls. None of these were individually expensive, but multiplied by 1k–10k rows they accounted for the bulk of the per-op cost.

Five small, low-risk changes target these hot paths. None changes runtime semantics; the test suite is unchanged.

**Fixes (5 files):**

1. `packages/view/src/render/runListItems.ts` — the per-item `$watch(newItem.data, { shallow: true })` calls in the all-keys-different fast path, the Replace/Insert branches, and the trailing append loop all hoisted to a single module-scope `SHALLOW_WATCH_OPTIONS` constant. `$watch` only reads `options?.shallow`, so one shared object serves every call. Removes one object allocation per created list item — i.e. 1k allocations per `run`/`add` and 10k per `runlots`.

2. `packages/view/src/render/addEvent.ts` + `packages/view/src/types/Context.ts` — the `region` field on stashed events is dead code: `addFragment` (the sole consumer) only reads `el`, `type`, and `listener`. Dropping it removes one property write per `addEvent` call. The row template emits two `addEvent`s per item, so this is ~2k writes per 1k-row create.

3. `packages/view/src/watch/proxyGet.ts` — the bottom-of-function `Reflect.get(target, key, receiver)` is replaced with `target[key]`. Every code path that reaches this point has already established the property is a plain data value (anything with a getter has early-returned above via the `propDescriptor.get` branch). Avoids one function call per property read on a watched object. This is the dominant per-effect-run overhead: each row effect reads `$state.selected` and `data.row` (×3 for `.id`/`.id`/`.label`), so a 1k-row render triggers ~3k of these calls.

4. `packages/view/src/render/buildClasses.ts` — `gatherClasses`'s `for (let [n, v] of Object.entries(value))` is replaced with `for (const n in value) gatherClasses(n, value[n], classes)`. The `Object.entries` call allocated a new array plus a `[k, v]` pair per entry on every invocation; `for-in` allocates nothing. Object literals (the dominant case — e.g. `{ danger: bool }`) have no inherited enumerable properties, so the two are equivalent for our usage. This is on the per-effect re-run hot path: a `select` op re-runs every row effect, each calling `buildClasses({ danger: ... })`.

5. `packages/view/src/render/formatText.ts` — fast path for `typeof value === "string"` returns the value directly instead of going through `String($unwrap(value))`. Strings already satisfy both concerns the `$unwrap`/`String` pair exists for (proxy unboxing and Symbol coercion). Saves two function calls per text interpolation on the dominant string branch — row labels in js-framework-bench hit this on every effect run.

**Timing impact (15-iteration run, median / min vs round-7 `results/js-framework.json`):**

| Op        | Round 7 (median) | Round 8 (median) | Round 8 (min) | Δ median   | Note                              |
| --------- | ---------------- | ---------------- | ------------- | ---------- | --------------------------------- |
| run (1k)  | 5.20ms           | **3.90ms**       | 3.60ms        | **−25%**   | Create 1000 rows                  |
| replace   | 7.10ms           | 7.20ms           | 6.70ms        | +1% (noise)| Replace all with 1000 new         |
| add       | 5.60ms           | **4.60ms**       | 4.00ms        | **−18%**   | Append 1000 to existing 1000      |
| update    | 1.20ms           | **0.90ms**       | 0.80ms        | **−25%**   | New objects for every 10th row    |
| select    | 0.10ms           | 0.00ms           | 0.00ms        | (sub-ms)   | Toggle `.danger` class on one row |
| swap      | 1.00ms           | **0.70ms**       | 0.60ms        | **−30%**   | Swap two rows                     |
| remove    | 0.70ms           | 0.60ms           | 0.50ms        | −14%       | Remove one row by splice          |
| runlots   | 37.00ms          | 37.40ms          | 35.70ms       | ~flat      | Create 10000 rows                 |
| clear     | 31.50ms          | 40.00ms          | **28.40ms**   | +27%/−10%  | Clear all rows (high variance\*)  |

\* `clear` showed unusually high variance on this run (median 40ms but min 28.4ms — faster than round 7's 31.5ms baseline). The machine was running several hundred concurrent vitest worker processes during measurement; the min-of-samples is the more reliable point of comparison here. None of the five changes touch `clearRegion`, `releaseRegion`, or the DOM-walk path, so any change to `clear` is measurement noise rather than a regression.

The wins compound across the bulk paths: `run`/`add` benefit from all five fixes (hoisted options + dropped `region` + cheap proxyGet during the per-item effect run + cheaper `buildClasses` and `formatText` inside that effect). `update` and `swap` benefit from the per-effect-run fixes (`buildClasses`, `formatText`, proxyGet) since their cost is dominated by re-running the row's className/text effect across 1k items. `runlots` is unchanged within noise because the per-item DOM-clone work (10 nodes × 10k rows) dominates the allocation savings.

### What this does NOT close

Round 4 noted that the residual gap to solid/octane on bulk creates is structural: each row still allocates a `ListItem`, a `$watch` `ProxyData` + `Map` + `Proxy`, an `Effect`, and a `DocumentFragment` clone. These five micro-fixes shave the constant factor (~20–30% on `run`/`add`/`update`/`swap`) but don't change the O(1)-per-item allocation shape. Closing the remaining gap to solid (3.2ms `run`, 2.3ms `add`) would require either compiler-level specialization — emitting direct DOM creation in place of `getFragment`/`addFragment` and skipping the per-item Proxy when the row template only reads fields — or a structural change to avoid rebuilding the entire `ListItem` chain in `buildItems` when most keys match.

### Regression coverage

The existing test suite (`pnpm exec vitest run` in `packages/view`) passes unchanged: 32 test files / 87 tests across `for`, `events`, `run`, `class`, `text`, `attributes`; 39 files / 111 tests across `watch`, `reactivity`, `mount`, `hydrate`. `tsgo --noEmit` typechecks clean. The build-classes unit tests (20 cases, covering nested objects, arrays, falsy values, `styleHash`) all pass with the `for-in` rewrite.

## Round 7: stale-subscription leak on region release — long-running popular-signal changes 4–11× faster

**Root cause found:** `releaseRegion` (the per-item teardown path inside `clearRegion`) ran each effect's optional cleanup function and truncated `region.effects`, but never detached the effect's source subscriptions from the signals' `firstTarget` lists. The result: every effect ever owned by a cleared region stayed in `signal.firstTarget` forever. When that signal next changed, `propagateSignal` walked the stale subs, queued the destroyed effects for re-run, and `clearSources` (only invoked after a real re-run) eventually pruned them — but only after they had re-executed against their now-detached DOM nodes.

This was invisible in the js-framework-bench medians because each op's `ensureState` resets to a known row count, and the bench's `select` measurement happens before `clear`. But in any long-lived session (a real app, or back-to-back bench iterations of the same op), the leaked subscriptions compound:

- After 1 round of "create 1k rows + clear" against a popular signal, the next mutation of that signal re-walked 1k stale subs and re-ran 1k no-op effects.
- After 10 rounds, 10k stale subs. After N rounds, Nk.

The leak also destabilised timing: V8 GC pauses from the accumulating garbage showed up as p99 spikes an order of magnitude above the mean.

**Fix (2 files):**

1. `packages/view/src/render/clearRegion.ts` — `releaseRegion` now walks each effect's `firstSource` list and unlinks every subscription from the signal's `firstTarget` doubly-linked list (`previousTarget`/`nextTarget`), then nulls `effect.firstSource`. This is the correct counterpart to `trackSignal`'s prepend-to-both-lists allocation: every subscription is removed from both lists when its owning effect is destroyed. The unlink handles the popular-signal case correctly — if `sub` is no longer the head of `signal.firstTarget` (because a newer subscription was prepended), we leave the head pointer alone and only splice `sub` out via its neighbours.

2. `packages/view/src/watch/$watch.ts` — bonus micro-fix: the per-call `{ get: proxyGet, set: proxySet }` handler literal is hoisted to a single module-scope `sharedHandler` constant. The handler is stateless (all state lives on `target[proxyDataSymbol]`), so one handler serves every proxy. Removes one object allocation per `$watch()` call — i.e. one per keyed-list item per render in `runListItems`.

**Micro-benchmark impact** (`packages/view/test/bench/destroyedRegion.bench.ts`, popular-signal pattern: N effects subscribed to one signal, list cleared, signal then mutated):

| Benchmark                                   | Before   | After    | Speedup     |
| ------------------------------------------- | -------- | -------- | ----------- |
| clear 1k subscribed-effect region           | 1.04ms   | 0.38ms   | **2.7×**    |
| selected mutation after 1k cleared effects  | 3.94ms   | 0.35ms   | **11.3×**   |
| selected mutation after 10×1k create+clear  | 15.16ms  | 3.70ms   | **4.1×**    |
| p99 of "1k cleared" mutation                | 32.71ms  | 0.53ms   | **61.7×**   |
| p99 of "10×1k create+clear" mutation        | 111.09ms | 4.16ms   | **26.7×**   |

The p99 collapse is the headline: GC pressure from the leak used to produce multi-hundred-ms spikes; the fix keeps mutation cost flat regardless of how many effects have been created and cleared against the signal.

**Timing impact on js-framework-bench ops:** neutral-to-positive on the canonical ops. `clear` itself is unchanged within noise (the new per-effect source-list walk is ~3 pointer ops per source, dominated by the existing `node.remove()` work). Ops that change a popular signal after a clear (`select`, partial `update`) are faster in proportion to how many prior sessions leaked subs into that signal — within a single fresh bench run that's near zero, so the median doesn't move; in a real app or repeated bench iteration it grows linearly with prior activity.

### Regression coverage

`packages/view/test/run/watch-destroyed-region.test.ts` adds two tests:

- after clearing a region, the signal's `firstTarget` list is empty (the structural invariant)
- after clearing a region of 1000 effects subscribed to one signal, repeated mutations of that signal do not re-run any of the destroyed effects (the behavioural invariant)

`packages/view/test/bench/destroyedRegion.bench.ts` is a vitest `bench` file (run with `pnpm exec vitest bench`) that exercises the popular-signal clear-then-mutate pattern at N=1k and across 10 rounds of create+clear.

## Round 6: phantom leading whitespace in `@for`/`@const` bodies — DOM census gap with preact closed from 1023 → 23 nodes

`TARGETS='[{"name":"torpor","url":"http://localhost:5283/","ready":"#run"},{"name":"preact","url":"http://localhost:5260/","ready":"#run"}]' node benchmarks/js-framework/run.mjs 10`

**Root cause found:** round 5 noted "the remaining gap to close is the residual DOM census (1022 whitespace text nodes inside inline `<a>` contexts)". Inspecting the compiled row template (`benchmarks/js-framework/torpor/dist/.../index.js`) showed the actual culprit was NOT inline `<a>` whitespace — it was a phantom leading space inside every `@for` body:

```js
const t_fragment_1 = getFragment(... 1, ` <tr><td ...>...</td>...</tr>`);
//                            leading space here ──^
```

`trimWhitespace` was already removing leading/trailing whitespace from the `@for` body — but it then collapsed the whitespace *between* the `@key` control node and the `<tr>` element to a single space, because it treated `@key` as a normal sibling. `@key` produces zero DOM output, so that single space became a phantom leading text node on every cloned row. 1000 rows × 1 phantom node ≈ the 1022 whitespace nodes in the census.

**Fix (3 files):**

1. `packages/view/src/compile/utils/nonRenderingOperations.ts` (new) — extracts the `NON_RENDERING_OPERATIONS` set (`@key`, `@const`, `@console`, `@debugger`, `@function`, `@async function`) so both the fragment builder and the whitespace trimmer share one source of truth.

2. `packages/view/src/compile/utils/trimWhitespace.ts` — now computes "has rendering sibling before/after" masks that treat non-rendering control nodes as invisible. A whitespace text node is removed if it has no rendering sibling on either side, so whitespace adjacent to `@key`/`@const`/etc. is treated as leading/trailing of the container rather than as significant inter-sibling whitespace. Comments are NOT included — they produce real DOM nodes (`<!-- -->`).

3. `packages/view/src/compile/build/client/buildFragment.ts` — imports `NON_RENDERING_OPERATIONS` from the shared util (no behavior change).

**Census impact (1k rows):**

| Metric | Round 5 | Round 6 | Preact |
|---|---|---|---|
| Total nodes | 11095 | **10095** | 10072 |
| Whitespace text | 1022 | **22** | 0 |
| Total text | 3043 | **2043** | 2021 |
| Gap vs preact | 1023 | **23** | — |

The residual 22 whitespace nodes are inter-`<div>` spaces in the button header (sibling block-level divs separated by single spaces — not inside any `@for` body). The remaining 23-node gap is those 22 + 1 SSR-anchor comment torpor emits inside `<tbody>` (`<!>`).

**Timing impact:** torpor's numbers are unchanged within noise (run 4.3ms, runlots 34.1ms, clear 32.9ms — all consistent with round 5). The win is structural: fewer DOM nodes mean less allocation, less `clearNodes` work, less memory, and torpor's DOM output now matches preact's nearly 1:1 (which also makes diff-based regression tests feasible). The compiler also emits slightly tighter code per `@for` body: `t_root(frag)` instead of `t_root(frag, true)` and `t_root_0 as HTMLElement` instead of `t_next(t_root_0) as HTMLElement`, because the first rendering child is now the element itself.

### Regression coverage

`packages/view/test/text/trimWhitespace.test.ts` adds three tests:
- whitespace between `@key` and `<tr>` in a `@for` body is removed (the benchmark pattern)
- whitespace adjacent to `@const` at the start of a container is removed
- whitespace between two rendering siblings is still collapsed to a single space when a `@const` is elsewhere in the container (guards against over-aggressive trimming)

## Round 5: O(N²) signal-subscription fixed — torpor now beats preact on every bulk op

`TARGETS='[{"name":"preact","url":"http://localhost:5260/"},{"name":"torpor","url":"http://localhost:5283/"}]' node benchmarks/js-framework/run.mjs 10`

**Root cause found:** `trackSignal` walked `signal.firstTarget` (the list of every target subscribed to a signal) to find an existing subscription to re-use, and to find the tail for appending. For a popular signal fanned out to N targets — which is exactly what happens in the js-framework-bench row template, where every item effect reads the parent's `$state.selected` — each subscription was O(N), giving O(N²) total. This is why round-3 `runlots` (10k rows) was 27× slower than preact while `run` (1k rows) was only 3× slower: the per-row cost grew linearly with row count.

A direct micro-benchmark of the fanout (`test/bench/trackSignal.bench.ts`) confirmed it: subscribing 1k effects to one signal took 1.1ms, but 10k effects took **92.8ms — an 84× slowdown for 10× more items**.

**Fix (2 files):**

1. `packages/view/src/watch/trackSignal.ts` — walk `target.firstSource` (the effect's own source list, bounded by its dependency count — typically <10) instead of `signal.firstTarget` (unbounded, N for popular signals). New subscriptions are prepended to both lists in O(1); the order of subscriptions within a signal's target list has no semantic meaning (effect run order is decided by the dependency graph, not subscription order).

2. `packages/view/src/watch/clearTargets.ts` — now a no-op. Previously it walked `signal.firstTarget` after each batch to remove inactive subscriptions, but it only unlinked from the signal side, leaving the subscription dangling in `target.firstSource`. With the new `trackSignal` looking up subscriptions via `target.firstSource`, that dangling sub would be reactivated even though it was no longer in the signal's target list — silently breaking propagation for computed values that hadn't yet re-run. Cleanup of unused subscriptions is already handled correctly by `clearSources`, which runs after each Effect / Computed re-run and removes from both lists.

| Op            | Preact | Torpor | Ratio     | Round-4 Torpor | Δ R4→R5  | Note                              |
| ------------- | ------ | ------ | --------- | -------------- | -------- | --------------------------------- |
| run (1k)      | 10.6ms | 4.5ms  | **0.44x** | 32.8ms         | **−86%** | Create 1000 rows                  |
| replace       | 15.9ms | 7.3ms  | **0.46x** | 48.7ms         | **−85%** | Replace all with 1000 new         |
| add           | 8.9ms  | 4.8ms  | **0.56x** | 68.0ms         | **−93%** | Append 1000 to existing 1000      |
| update        | 1.4ms  | 0.9ms  | **0.63x** | 11.1ms         | **−92%** | New objects for every 10th row    |
| select        | 0.6ms  | 0.1ms  | **0.17x** | 0.1ms          | (sub-ms) | Toggle `.danger` class on one row |
| swap          | 0.8ms  | 0.7ms  | 0.97x     | 0.9ms          | ~flat    | Swap two rows                     |
| remove        | 0.8ms  | 0.6ms  | **0.88x** | 0.7ms          | ~flat    | Remove one row by splice          |
| runlots (10k) | 72.7ms | 34.8ms | **0.48x** | 2117ms         | **−98%** | Create 10000 rows                 |
| clear         | 39.8ms | 34.1ms | **0.86x** | 30.8ms         | ~flat    | Clear all rows                    |

Torpor is now **faster than preact on every bulk operation**, including `runlots` (10k rows) where it was previously 27× slower. Fine-grained ops (`select`, `remove`, `swap`) were already at or below preact and remain so. The remaining gap to close is the residual DOM census (1022 whitespace text nodes inside inline `<a>` contexts — see round 3 notes).

### Micro-benchmark verification

`packages/view/test/bench/trackSignal.bench.ts` directly exercises the popular-signal fanout pattern (N effects each subscribing to one shared signal):

| N   | Before (round 4) | After (round 5) | Speedup   |
| --- | ---------------- | --------------- | --------- |
| 1k  | 1.11ms           | 0.45ms          | 2.5×      |
| 10k | 92.75ms          | 4.48ms          | **20.7×** |

The 10× input growth now produces ~10× time growth (was 84×), confirming the O(N²) → O(N) fix.

### Regression coverage

`packages/view/test/run/watch-popular-signal.test.ts` adds two tests:

- 1000 effects subscribed to one signal all re-run correctly when it changes
- an effect that re-subscribes to a popular signal across conditional branches stays subscribed

## Round 4 investigation: ListItem pooling — NO MEASURABLE IMPACT (reverted)

Tried pooling (reusing) ListItem objects in `buildItems` when the data reference was unchanged. The compiled `createNewItems` checked whether the old item at the same index had the same key and raw data reference, and if so reused the old ListItem directly — skipping allocation, `transferListItemData`, and `updateListItem`. An identity check (`oldItem === newItem`) at the top of `transferListItemData` short-circuited pooled items.

**Measured A/B results** (30-iteration micro-benchmark, `update` op, same machine):

| Variant                                        | min   | p50   | mean  |
| ---------------------------------------------- | ----- | ----- | ----- |
| Baseline (no pooling)                          | 4.0ms | 4.6ms | 4.5ms |
| Pooling via `t_old.data.row` (proxy)           | 4.2ms | 5.2ms | 5.2ms |
| Pooling via `t_old.rawData.row` (bypass proxy) | 4.1ms | 5.0ms | 4.9ms |

**Conclusion:** Pooling was consistently slower by ~8–13%. Two root causes:

1. **`proxySet` already had a `value !== oldValue` equality check** (`proxySet.ts:19`). For unchanged rows, the `updateListItem` callback's assignment `t_old_item.data.row = t_new_item.data.row` was already a no-op (same reference → early return). So PERF.md #2's claim that "all 1000 effects fire" was incorrect — effects never re-fired for unchanged items.

2. **The reuse check's overhead matched the savings.** The per-item work skipped (5 reference assignments in `transferListItemData` + 1 `proxySet` equality check) costs ~300ns/item. The reuse check (array access + key comparison + data reference comparison + ternary branch) costs ~300–400ns/item. Net neutral-to-negative, before accounting for V8 JIT and object-shape effects from the extra `rawData` field.

**What this means for future work:** The `update` op's 7.4× gap to preact is NOT from per-item effect re-runs or per-item allocation. It's from the structural cost of re-running the list's `$run` effect (which iterates all items, rebuilds the region chain, and walks the reconciler). Closing this gap requires either (a) avoiding the full list re-run when only a few items changed, or (b) reducing the per-item cost of DOM cloning + effect setup + proxy allocation in the `create` path — both of which are architectural changes.

## js-framework benchmark — round 3: all-keys-different fast path + table/list whitespace trim (torpor vs preact, 3-iteration quick run, averaged over 2 runs)

`TARGETS='[{"name":"preact","url":"http://localhost:5260/"},{"name":"torpor","url":"http://localhost:5283/"}]' node benchmarks/js-framework/run.mjs 3`

Two changes stacked on top of round 2:

1. **All-keys-different fast path** (`packages/view/src/render/runListItems.ts`): when the reconciler detects that no keys overlap between the remaining old and new ranges, it skips the per-item while-loop machinery (4 key comparisons, region-chain rewiring, interleaved create/clear) and instead batch-clears all old items (reverse order so each region's DOM nodes are still attached) then batch-creates all new items in a tight loop. Helps the "replace all" / "rebuild" case.

2. **Table/list whitespace trim** (`packages/view/src/compile/utils/trimWhitespace.ts`): whitespace-only text nodes between children of `tr`/`tbody`/`thead`/`tfoot`/`colgroup`/`table`/`ul`/`ol`/`select` are now removed entirely instead of collapsed to a single space — table and list layout collapses this whitespace, so the text nodes were pure overhead. Whitespace text nodes in the 1k-row benchmark dropped from 4022 to 1022 (the residual 1022 are inside `<a>` tags around `<span>` icons — inline whitespace that IS significant for rendering).

| Op            | Preact | Torpor | Ratio     | Round-2 Torpor | Round-1 Torpor | Δ R1→R3    | Note                              |
| ------------- | ------ | ------ | --------- | -------------- | -------------- | ---------- | --------------------------------- |
| run (1k)      | 10.9ms | 32.8ms | 3.01x     | 36.3ms         | 35.0ms         | **−6.3%**  | Create 1000 rows                  |
| replace       | 16.0ms | 48.7ms | 3.04x     | 57.5ms         | 63.5ms         | **−23.3%** | Replace all with 1000 new         |
| add           | 9.3ms  | 68.0ms | 7.31x     | 80.4ms         | 85.5ms         | **−20.5%** | Append 1000 to existing 1000      |
| update        | 1.5ms  | 11.1ms | 7.40x     | 13.5ms         | 13.6ms         | **−18.4%** | New objects for every 10th row    |
| select        | 0.8ms  | 0.1ms  | **0.13x** | 0.0ms          | 0.1ms          | (sub-ms)   | Toggle `.danger` class on one row |
| swap          | 0.7ms  | 0.9ms  | 1.29x     | 0.8ms          | 0.7ms          | ~flat      | Swap two rows                     |
| remove        | 0.9ms  | 0.7ms  | **0.78x** | 0.7ms          | 0.7ms          | ~flat      | Remove one row by splice          |
| runlots (10k) | 77.2ms | 2117ms | 27.42x    | 2296ms         | 2596ms         | **−18.5%** | Create 10000 rows                 |
| clear         | 36.5ms | 30.8ms | 0.84x     | 30.3ms         | 46.8ms         | **−34.2%** | Clear all rows                    |

DOM census (1k rows): 11095 nodes = 8051 elements + 3043 text (1022 whitespace) + 1 comment. Preact: 10072 nodes = 8051 elements + 2021 text, 0 whitespace. The gap is now 1023 nodes (down from 4023 in round 2 and ~13083 in round 1) — all inside inline `<a>` contexts.

## js-framework benchmark — round 2: after whitespace-trimming fix (torpor vs preact, 3-iteration quick run)

`TARGETS='[{"name":"preact","url":"http://localhost:5260/"},{"name":"torpor","url":"http://localhost:5283/"}]' node benchmarks/js-framework/run.mjs 3`

The three "Fix: trim whitespace by default" commits (66e68fe7, 7e6d1ddf, 99af57c8) added compile-time whitespace trimming. DOM census for the 1k-row table dropped from ~13k whitespace text nodes to 4022 — the remaining 4022 are inline-adjacent whitespace inside `<td>` cells (around the `<a>` tags, ~4 per row × 1000), which can't be stripped without changing inline rendering.

| Op            | Preact | Torpor   | Ratio     | Round-1 Torpor | Δ vs round 1 | Note                              |
| ------------- | ------ | -------- | --------- | -------------- | ------------ | --------------------------------- |
| run (1k)      | 11.0ms | 36.3ms   | 3.30x     | 35.0ms         | +3.7%        | Create 1000 rows                  |
| replace       | 16.2ms | 57.5ms   | 3.55x     | 63.5ms         | **−9.4%**    | Replace all with 1000 new         |
| add           | 8.9ms  | 80.4ms   | 9.03x     | 85.5ms         | **−6.0%**    | Append 1000 to existing 1000      |
| update        | 1.7ms  | 13.5ms   | 7.94x     | 13.6ms         | ~flat        | New objects for every 10th row    |
| select        | 1.0ms  | 0.0ms    | **0.00x** | 0.1ms          | (sub-ms)     | Toggle `.danger` class on one row |
| swap          | 0.6ms  | 0.8ms    | 1.33x     | 0.7ms          | ~flat        | Swap two rows                     |
| remove        | 0.9ms  | 0.7ms    | **0.78x** | 0.7ms          | ~flat        | Remove one row by splice          |
| runlots (10k) | 73.0ms | 2296.5ms | 31.46x    | 2595.6ms       | **−11.5%**   | Create 10000 rows                 |
| clear         | 33.5ms | 30.3ms   | 0.90x     | 46.8ms         | **−35.3%**   | Clear all rows                    |

DOM census (1k rows): 14095 nodes = 8051 elements + 6043 text (4022 whitespace) + 1 comment. Preact: 10072 nodes = 8051 elements + 2021 text, 0 whitespace.

The whitespace fix delivered the gains PERF.md predicted: `clear` (−35%) and bulk-create ops (`runlots` −12%, `replace` −9%, `add` −6%) — exactly the ops that pay per-text-node cleanup/insertion. Fine-grained ops (`select`, `remove`, `swap`) were already at or below preact and unchanged. The remaining gap to preact is the other root causes below (#1 reconciler, #2 update, #3 allocation).

## js-framework benchmark — round 1: pre-whitespace baseline (torpor vs preact, 3-iteration quick run)

`TARGETS='[{"name":"preact","url":"http://localhost:5260/"},{"name":"torpor","url":"http://localhost:5283/"}]' node benchmarks/js-framework/run.mjs 3`

| Op            | Preact | Torpor   | Ratio     | Note                              |
| ------------- | ------ | -------- | --------- | --------------------------------- |
| run (1k)      | 9.3ms  | 35.0ms   | 3.8x      | Create 1000 rows                  |
| replace       | 14.5ms | 63.5ms   | 4.4x      | Replace all with 1000 new         |
| add           | 9.2ms  | 85.5ms   | 9.3x      | Append 1000 to existing 1000      |
| update        | 1.3ms  | 13.6ms   | 10.5x     | New objects for every 10th row    |
| select        | 0.6ms  | 0.1ms    | **0.17x** | Toggle `.danger` class on one row |
| swap          | 0.7ms  | 0.7ms    | ~1x       | Swap two rows                     |
| remove        | 1.1ms  | 0.7ms    | **0.64x** | Remove one row by splice          |
| runlots (10k) | 81.6ms | 2595.6ms | **31.8x** | Create 10000 rows                 |
| clear         | 36.5ms | 46.8ms   | 1.3x      | Clear all rows                    |

## Key observations

1. **Fine-grained ops win, bulk ops lose.** `select` and `remove` outperform preact because the proxy system can target individual nodes without reconciling the list. `update` (10x slower) and `run` (3.8x slower) suffer because the reconciler must process the entire list even when most rows are unchanged.

2. **All-keys-different bulk replace is the worst case.** Every run/replace creates completely new objects with fresh IDs. The reconciler enters the Replace branch for every item — a full `create()` + `clearRegion()` + region chain management per row. Preact's VDOM diff handles this with a single O(n) pass and minimal allocations.

3. **runlots (10k rows) is 31x slower than preact.** This isn't a scaling issue in the `@for` template itself — the gap widens dramatically under load. Preact creates 10k VDOM nodes and diffs once. Torpor's reconciler creates 10k `ListItem` objects, 10k `$watch` proxies, links the region chain, then cleans up the previous 10k items.

4. **Whitespace text nodes inflate DOM.** The census shows 13k whitespace text nodes for torpor vs 0 for preact. Template whitespace between elements in `.torp` files is emitted as text nodes, adding DOM weight and increasing `clearNodes` work.

## Root causes and suggestions

### 1. Reconciler: Replace skips optimization for all-keys-different ✅ ADDRESSED (round 3)

**Problem:** When all keys differ (e.g., `buildData()` replaces the entire dataset), the reconciler walks through the common length doing one-by-one Replace (create + insertBefore + clearRegion). For non-matching keys it builds hash maps, then falls back to the same Replace. This is O(n) allocations per item for every item.

**Fix (round 3):** `runListItems` now detects zero key overlap between remaining old/new ranges (checked during the lazy keymap build) and takes a fast path: batch-clears all old items in reverse order (so each region's DOM nodes are still attached when `clearRegion` walks them) then batch-creates all new items in a tight `pushRegion`/`create`/`popRegion` loop. Skips the while loop's 4 key comparisons per iteration, the per-item `savedPrevious` save/restore, and the manual `previousRegion`/`nextRegion` reassignments. The per-item cost (Proxy allocation, effect setup, event listeners, DOM cloning inside `create`) is unchanged — those are covered by root causes #2 and #3 below.

### 2. Reconciler: Update (key match) still re-registers everything — INVESTIGATED (round 4, no fix needed)

**Problem:** When keys match (update changes only every 10th row), the `updateListItem` callback copies data properties via `t_old_item.data.row = t_new_item.data.row`. This triggers the SHALLOW proxy setter for `.row`, which then re-runs ALL effects inside the matched item — even for rows whose label didn't change. For 1000 rows, all 1000 effects fire to update only 100 of them.

**Finding (round 4):** This was a misdiagnosis. The proxy setter (`proxySet.ts:19`) already has a `value !== oldValue` equality check, so unchanged rows' effects do NOT re-fire. The `updateListItem` assignment is a no-op for same-reference data. The real cost of the `update` op is the structural overhead of re-running the list's `$run` effect (iterating all items, rebuilding the region chain, walking the reconciler), not per-item effect re-runs.

**ListItem pooling attempt (round 4):** Tried reusing old ListItem objects when the data reference was unchanged (skipping allocation + `transferListItemData` + `updateListItem` entirely). Measured A/B showed NO improvement — actually 8–13% slower because the reuse check overhead matched the savings. See round 4 notes above.

### 3. `ListItem` and `$watch` allocation per render — INVESTIGATED (round 4, pooling doesn't help)

**Problem:** Every `buildItems()` call creates new `ListItem` objects with `t_list_item({ row }, row.id)`. For every create, the data is wrapped with `$watch(data, { shallow: true })`. This means every render allocates a new ListItem + new shallow proxy for EVERY row. In preact, the VDOM node is a lightweight object reused through the reconciler.

**Finding (round 4):** ListItem pooling was implemented and benchmarked but showed no measurable improvement. The per-item allocation cost (~100ns/object) is too small relative to the dominant costs (list effect re-run, DOM operations, proxy trap overhead). See round 4 notes above for details.

### 4. Whitespace text nodes in compiled output ✅ FIXED

**Problem:** Template indentation between `.torp` elements produces text nodes. For the 1000-row benchmark, this added 13082 whitespace text nodes (across 14 rows of buttons + 1000 data rows with 4+ columns each). This multiplied `clearNodes` and DOM insertion work.

**Fix (commits 66e68fe7, 7e6d1ddf, 99af57c8):** Added `packages/view/src/compile/utils/trimWhitespace.ts` which strips block-level whitespace at compile time. Whitespace text nodes in the 1k-row benchmark dropped from ~13k to 4022 (the residual 4022 are inline-adjacent whitespace inside `<td>` cells around `<a>` tags — removing them would change inline rendering; React/Svelte strip them with `white-space`-aware logic, a future improvement). Measured impact in round 2 above: `clear` −35%, `runlots` −12%, `replace` −9%, `add` −6%.

### 5. Region chain maintenance per Replace item (partially addressed)

**Problem:** The Replace branch does `pushRegion(newStartItem, true)` then manually rewires `previousRegion`/`nextRegion` then `clearRegion(oldStartItem)` which traverses and modifies the region chain. This is heavy per-item bookkeeping.

**Round-3 fast path:** When no keys overlap between remaining old/new ranges, the entire Replace branch (including the per-item chain rewiring) is bypassed — old items are cleared in reverse order and new items are created in a tight `pushRegion`/`create`/`popRegion` loop without the `savedPrevious` save/restore or the manual `previousRegion`/`nextRegion` reassignments. The per-item Replace branch is still used for mixed cases (some keys match, some don't).

### 6. `transferListItemData` missing depth copy

**Problem:** `transferListItemData` copies `startNode`, `endNode`, and `data` from old to new items, but does NOT copy `depth`. Items matched by key retain `depth = -1` (from `newListItem`). When a subsequent Replace phase calls `clearRegion` on a matched item, it traverses `nextRegion` looking for children — and since the matched item has depth -1, it treats all subsequent items (at depth 1) as children, releasing them prematurely. See `runListItems.ts` line 50.

**Fix applied:** `transferListItemData` now copies `newItem.depth = oldItem.depth`. This was the root cause of the "1001 items after clear" bug.

### 7. `context.previousRegion` corruption in Replace branch

**Problem:** The Replace branch calls `pushRegion(newStartItem, true)` which sets `context.previousRegion = newStartItem` (pushRegion line 23). After `popRegion` (which only restores `context.activeRegion`), `context.previousRegion` is left pointing to the new item from the previous iteration's Replace. On the next iteration, `pushRegion(nextNewItem, true)` corrupts the chain by linking `context.previousRegion.nextRegion = nextNewItem`, which overwrites the proper link set up by the manual rewiring.

**Fix applied:** `context.previousRegion` is saved before `pushRegion` and restored after `popRegion`, preventing the chain corruption.

## Files changed

| File                                                | Change                                                                                                                                                                                  |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/view/src/render/runListItems.ts`          | All-keys-different fast path (batch clear + batch create); `transferListItemData` now copies `depth`; `context.previousRegion` saved/restored in Replace branch                         |
| `packages/view/src/compile/utils/trimWhitespace.ts` | Whitespace-only nodes inside table/list containers (`tr`, `tbody`, `thead`, `tfoot`, `colgroup`, `table`, `ul`, `ol`, `select`) removed entirely instead of collapsed to a single space |
| `packages/view/test/text/trimWhitespace.test.ts`    | Added test for inter-child whitespace removal inside table/list containers                                                                                                              |
| `packages/view/test/text/whitespace.test.ts`        | Updated hydration test for `<ul>` to reflect whitespace removal                                                                                                                         |
| `benchmarks/js-framework/torpor/`                   | New torpor fixture (package.json, vite.config, Main.torp, main.js, index.html)                                                                                                          |
| `benchmarks/js-framework/run.mjs`                   | Added torpor target on port 5283                                                                                                                                                        |
| `benchmarks/js-framework/run-reorder.mjs`           | Added torpor target on port 5283                                                                                                                                                        |
| `benchmarks/bench.mjs`                              | Added torpor-jsbench to js-framework suites                                                                                                                                             |
| `pnpm-workspace.yaml`                               | Added `benchmarks/js-framework/torpor`                                                                                                                                                  |
