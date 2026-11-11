# view benchmarks

Client-side benchmark comparing `@torpor/view` with React, Svelte, Vue and
Solid. Adapted from the js-framework-bench suite in `torpor-bench`
(krausest/js-framework-benchmark methodology), trimmed so a full run takes
~1–2 minutes. Nine core ops:

`run` (create 1,000 rows), `replace` (re-create), `add` (append 1,000), 
`update` (every 10th row), `select`, `swap`, `remove`, `runlots` (10,000 rows)
and `clear` (of the 10,000-row table).

Plus a 14-op keyed-reorder matrix (from `torpor-bench`'s run-reorder harness):
`reverse`, `shuffle` (seeded), `rotatef`/`rotateb`, `prepend100`, `append100`,
`insertmid100`, `removefirst`, `removeevery10`, and `displace3` (move the
first 3 rows, as a group, to the end).

Each framework implements the same keyed 1,000-row table with the same DOM
shape, driven through the same buttons (`#run`, `#runlots`, `#add`, `#update`,
`#clear`, `#swaprows`, plus the reorder row `#reverse`, `#shuffle`,
`#rotatef`, `#rotateb`, `#prepend100`, `#append100`, `#insertmid100`,
`#removefirst`, `#removeevery10`, `#displace3`) and per-row select/remove
anchors.

## Reorder ops

Most reorder ops sit far below `performance.now()`'s resolution (a rotate is
~1 DOM move), so each timed sample loops REPS clicks inside one
`performance.now()` window and divides: REPS=100 for the rotate pair, REPS=20
for `displace_k`/`removefirst`/`removeevery10`, REPS=4 for `reverse` +
`shuffle`, REPS=1 for the 100-row inserts. Every sample starts from a fresh
1,000-row `#run` (outside the timed window); each click flushes synchronously
so REPS state changes can't coalesce into one commit.

Correctness is gated before timing: for each reorder op the runner stamps
every `<tr>` with an expando, performs one click, and asserts (a) every
surviving row is rendered by the *same* DOM node (the framework moved it, not
rebuilt it) and (b) DOM order matches the op replayed on the pre-click row-id
list. `shuffle`'s expected order comes from replaying the fixtures' shared
deterministic shuffle stream (module-level mulberry32, seed 42, one seed per
`#shuffle` click — byte-identical in every fixture and mirrored in the
runner). A gate failure is recorded per target/op, the op's timing is skipped
(shown as `GATE FAIL` / `—`), and the run carries `meta.identityGate` in the
JSON payload.

## Running

```sh
pnpm bench            # from this folder; 5 iterations per op
node run.mjs 8        # more iterations
ITER=3 pnpm bench     # fewer, faster
TARGETS='["torpor","vue"]' node run.mjs   # subset
```

Options:

- First CLI arg (or `ITER`) — samples per op (default 5).
- `TARGETS='["torpor","vue"]'` or
  `TARGETS='[{"name":"x","url":"http://…","ready":"#run"}]'` — select fixtures,
  or point at an already-running server.
- `BENCH_JSON=path` — also write a machine-readable copy.

At the end the runner prints the comparison table and writes to
`benchmarks/results/`: `view.json` plus a self-contained `view.html` for the
latest run (heatmapped timing and DOM-census tables, weighted geometric-mean
total vs torpor), archived as `view-<timestamp>.{json,html}`. Each page shows
when it was run and links to the previous/next run of the suite and to the
`build` suite's latest page.

The runner starts each fixture's vite dev server (production mode — the
configs set `mode: 'production'` and pin `NODE_ENV` so framework runtimes are
measured without dev guards) and kills them on exit. Requires the Playwright
chromium browser (`npx playwright install chromium` if missing).

## Fixtures

| Fixture | Notes |
|---|---|
| `fixtures/torpor` | `@torpor/view`, keyed `@for` |
| `fixtures/react` | React 19 hooks, memo'd rows, `flushSync` |
| `fixtures/solid` | Solid, keyed `<For>` (commits synchronously on click) |
| `fixtures/svelte` | Svelte 5 runes, keyed `{#each}`, `flushSync` |
| `fixtures/vue` | Vue 3, keyed `v-for` over a `shallowRef`, `__benchFlush` → `nextTick` |

Frameworks without a synchronous commit flush their scheduler inside the timed
window (Vue exposes `window.__benchFlush`), so scheduling cost stays in the
measurement — same protocol as the torpor-bench suite.

`Math.random` is seeded identically in every page, so label generation is
deterministic across frameworks and runs. A steady-state DOM census
(elements/text/comments at 1K rows) is printed alongside the timings.
