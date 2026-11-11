# Benchmarks

Two quick-running benchmark suites for the torpor packages:

| Folder | Measures | Compares against | Runner |
|---|---|---|---|
| [`view`](./view) | Client-side DOM updates (krausest js-framework-benchmark ops) | React, Svelte, Vue, Solid | Playwright |
| [`build`](./build) | Server-side HTTP request handling | Express, Hono, Fastify, Elysia | autocannon |

Both suites are deliberately trimmed so a full run finishes in about a minute,
making them cheap enough to run often (e.g. before and after a change).

```sh
cd benchmarks/view && pnpm bench
cd benchmarks/build && pnpm bench
```

Each run prints a comparison table and writes to `benchmarks/results/`: the
latest run as `view` / `build` `.json` + `.html`, plus an immutable archive
per run (`view-<timestamp>.html` + `.json`). Every page shows the time it was
run and links to the previous and next run of its suite (a run's "next" link
is backfilled by the following run) as well as to the other suite's latest
page — open one and follow the links.

See each folder's README for options (iterations, duration, filters) and
methodology notes.

<!-- results:auto -->

## Latest results

2026-11-11 00:59 UTC · interactive report: [view.html](./results/view.html) · archive: [view-…]

Versions: @torpor/view@1.2.6 · react@19.3.1 + react-dom@19.3.1 · solid-js@1.9.19 · vue@3.5.45 · svelte@5.57.3

| op (ms · lower is better) | torpor  | react   | solid   | vue     | svelte  |
|---|---:|---:|---:|---:|---:|
| run       | **2.58** | 46.9    | 3.44    | 6.60    | 4.14    |
| replace   | **5.44** | 48.4    | 6.42    | 8.58    | 6.96    |
| add       | **2.36** | 23.5    | 2.62    | 6.34    | 3.46    |
| update    | **0.380** | 30.0    | 1.32    | 1.32    | 0.820   |
| select    | 0.380   | 5.48    | **0.240** | 0.300   | 0.340   |
| swap      | **0.380** | 22.7    | 0.460   | 2.14    | 0.800   |
| remove    | **0.180** | 7.12    | 0.360   | 1.32    | 0.600   |
| runlots   | **21.4** | 466     | 24.6    | 47.1    | 30.3    |
| clear     | 27.0    | 74.6    | **26.7** | 29.7    | 30.3    |
| **total (geo vs torpor)** | **1.00×** | 7.75×   | 1.09×   | 1.60×   | 1.28×   |

Totals are reference-weighted geometric means vs torpor (1.00 = baseline). Best per row in bold.

<!-- /results:auto -->

