# Torpor Benchmark Performance Notes

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
