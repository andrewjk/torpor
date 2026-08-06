# Torpor Benchmark Performance Notes

Benchmark: `TARGETS='[{"name":"torpor","url":"http://localhost:5283/","ready":"#run"},{"name":"solid","url":"http://localhost:5179/","ready":"#run"}]' node benchmarks/js-framework/run.mjs 25`

Current standing (Round 12): torpor is competitive with solid on most ops; the remaining gap is `runlots` (~26ms vs ~20ms) and `add` (~3.7ms vs ~2.2ms), both dominated by per-row DOM-clone + region/effect bookkeeping cost.

## Things to explore in the future

- **DOM node pooling** — reuse row subtrees across create/clear cycles instead of re-cloning. **Unclaimed ground** (no surveyed framework does it; all re-clone via `cloneNode(true)` or rebuild via `createElement` per row). Caveats are real, though: bounded pool caps limit the benefit, pooled nodes carry stale state (className/handler props/direct mutations) that must be reset, and — strategically — pooling attacks the `cloneNode` cost which is *shared ground with Solid* (Solid clones per row too), whereas the actual `runlots` gap to Solid is in per-row `ListItem` + `Effect` + region bookkeeping, not the clone. So pooling helps torpor-vs-itself on churny workloads but likely doesn't close the gap to Solid, and imports memory/stale-state risk. Lower priority than it first looked.

## Things that didn't pan out

- **Batch `insertBefore` (DocumentFragment batching)** — build all new rows into one `DocumentFragment` and issue a single `insertBefore` per pass instead of one per row. Tested by patching the dist's `addElement` + both create loops (no-overlap fast path + trailing append) to batch into a fragment. Result: a **~7–12% regression** on `runlots` (median ~28.2ms vs ~26ms baseline) and ~8% on `add`. Batching doesn't reduce the native call count — each node still gets one detach+reattach (`appendChild` into the fragment), plus the fragment's final `insertBefore` iterates the children again, plus one fragment allocation. Browsers don't relayout per `insertBefore` within a synchronous block, so there's no deferred layout work to save. Net negative. (Matches the prior in-house attempt that "didn't speed things up much"; this run shows it's actively harmful, not just neutral.)
- **Inline comma-expression traversal (Solid-style bare property access)** — V8 (TurboFan) already inlines the `nodeChild`/`nodeNext`/`nodeSkip` wrappers in the hot create-callback path by speculating the hydration branch false; pure-traversal micro-bench showed 0.2%, real create-callback A/B showed ~1% within the ±1ms noise band. The predicted ~2.5ms win used the *non-inlined* call cost, which doesn't apply.
- **ListItem pooling** (R4) — `proxySet` already had a `value !== oldValue` equality check making unchanged-row updates a no-op; the reuse-check overhead matched the savings (8–13% slower in A/B).
- **Cached prototype getters** (Svelte/Ripple trick) — targets megamorphic inline-cache sites (>4 shapes), but the benchmark row hits `.firstChild` on only ~3 element types (polymorphic, already fast); and the wrappers are already inlined per the traversal finding above. Moot.
- **Ripple/Svelte template caching** — investigated as potentially stealable; it's structurally identical to what torpor already does (cache the element/content, `cloneNode(true)` per instance). Ripple uses a lazy closure vs torpor's eager array, a one-time difference with no per-row impact. Nothing to steal.

## Things that were done

Listed newest-first. Improvements are vs the prior round unless noted.

- **LIS-based list reconciliation** — replaced the snabbdom-derived 4-way greedy reconciler (`runListItems`) with a hybrid: the snabbdom 4-way head/tail/rotation loop (the *good* part — O(1) per item, no keymap) now falls to a **longest-increasing-subsequence** pass for the messy middle instead of the greedy Move branch (the *bad* part, which did ~(N−k) DOM moves for a `displace_k`). LIS computes the minimal move set. New `packages/view/src/render/getSequence.ts`. **`displace_3`–`displace_8` 1.13ms → 0.41ms (−64%)**, `shuffle` min 1.75 → 1.22, and rotate/swap/append/prepend (already optimal under snabbdom) are unchanged. Main-benchmark ops (`run`/`runlots`/`add`/`update`) unaffected — those go through the no-overlap fast path, not LIS. The minibench (200 rounds × 10 patterns, real jsdom DOM ops) predicted the win before any framework code was touched.

- **R12 — leaf-row createListItem**: skip per-row `pushRegion`/`popRegion` for leaf `@for` bodies (no nested controls). `run` −6%, `runlots` min −1.5%.
- **R11 — event delegation**: Solid-style delegated events (one document listener per type, handler stashed on element property). `run`/`replace`/`runlots` −2–3%; 20000 `addEventListener` calls → 2 on `runlots`.
- **R10 — single-root-element codegen**: clone `template.firstElementChild` directly, skipping the per-row `DocumentFragment` wrapper. `runlots` −19%, `add` −12%, `clear` −10%.
- **R9 — no-proxy `@for` specialization**: skip the per-item `$watch` Proxy when the body never writes loop vars; compiler emits `updateListItem` that re-runs effects only on reference change. `run`/`add`/`runlots` −8–11%, `update` now beats solid.
- **R8 — hot-path allocation & proxy-trap fixes**: hoisted shared `SHALLOW_WATCH_OPTIONS`, dropped dead `region` field on stashed events, `target[key]` over `Reflect.get`, `for-in` over `Object.entries`, string fast-path in `formatText`. `run`/`update`/`swap` −20–30%.
- **R7 — stale-subscription leak fix**: `releaseRegion` now detaches effect source-subscriptions from signal target-lists on region teardown. Popular-signal mutations 4–11×, p99 collapse (61× on the 1k-cleared case).
- **R6 — phantom leading whitespace**: whitespace between `@key`/`@const` and siblings was emitted as a phantom leading text node per row. Fixed via whitespace-aware trimming that treats non-rendering control nodes as invisible. DOM census 11095 → 10095 nodes (matches preact's 10072).
- **R5 — O(N²) signal-subscription fix**: `trackSignal` walked `signal.firstTarget` (unbounded) instead of `target.firstSource` (bounded). `runlots` 2117ms → 35ms (−98%); torpor now beats preact on every bulk op.
- **R3 — all-keys-different fast path + table/list whitespace trim**: batch clear + batch create when no keys overlap; strip whitespace inside table/list containers. `replace` −23%, `add` −20%.
- **R2 — compile-time whitespace trimming**: strip block-level whitespace from `.torp` templates. `clear` −35%, `runlots` −12%.
- **Bug fixes (early rounds)**: `transferListItemData` now copies `depth` (was the "1001 items after clear" bug); `context.previousRegion` saved/restored around the Replace branch (was corrupting the region chain).
