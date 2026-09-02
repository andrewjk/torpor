# view benchmarks

Client-side benchmark comparing `@torpor/view` with React, Svelte, Vue and
Solid. Adapted from the js-framework-bench suite in `torpor-bench`
(krausest/js-framework-benchmark methodology), trimmed to the core nine ops so
a full run takes ~1 minute:

`run` (create 1,000 rows), `replace` (re-create), `add` (append 1,000), 
`update` (every 10th row), `select`, `swap`, `remove`, `runlots` (10,000 rows)
and `clear` (of the 10,000-row table).

Each framework implements the same keyed 1,000-row table with the same DOM
shape, driven through the same buttons (`#run`, `#runlots`, `#add`, `#update`,
`#clear`, `#swaprows`) and per-row select/remove anchors.

## Running

```sh
pnpm bench            # from this folder; 5 iterations per op
node run.mjs 8        # more iterations
ITER=3 pnpm bench     # fewer, faster
```

Options:

- First CLI arg (or `ITER`) — samples per op (default 5).
- `TARGETS='[{"name":"torpor","url":"http://localhost:5483/","ready":"#run"}]'` —
  run a subset against already-running dev servers instead of letting the
  runner start them.
- `BENCH_JSON=path` — also write machine-readable results.

The runner starts each fixture's vite dev server (production mode — the
configs set `mode: 'production'` and pin `NODE_ENV` so framework runtimes are
measured without dev guards) and kills them on exit. Requires the Playwright
chromium browser (`npx playwright install chromium` if missing).

## Fixtures

| Fixture | Notes |
|---|---|
| `fixtures/torpor` | `@torpor/view`, keyed `@for` |
| `fixtures/react` | React 19 hooks, memo'd rows, `flushSync` |
| `fixtures/solid` | Solid, keyed `<For>`, `flush()` |
| `fixtures/svelte` | Svelte 5 runes, keyed `{#each}`, `flushSync` |
| `fixtures/vue` | Vue 3, keyed `v-for` over a `shallowRef`, `__benchFlush` → `nextTick` |

Frameworks without a synchronous commit flush their scheduler inside the timed
window (Vue exposes `window.__benchFlush`), so scheduling cost stays in the
measurement — same protocol as the torpor-bench suite.

`Math.random` is seeded identically in every page, so label generation is
deterministic across frameworks and runs. A steady-state DOM census
(elements/text/comments at 1K rows) is printed alongside the timings.
