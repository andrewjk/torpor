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

2026-11-11 02:16 UTC · interactive report: [view.html](./results/view.html) · archive: [view-…]

Versions: @torpor/view@1.2.6 · react@19.3.1 + react-dom@19.3.1 · solid-js@1.9.19 · vue@3.5.45 · svelte@5.57.3

| op (ms · lower is better) | torpor  | react   | solid   | vue     | svelte  |
|---|---:|---:|---:|---:|---:|
| run       | **2.86** | 6.58    | 3.40    | 4.52    | 3.06    |
| replace   | **5.48** | 10.6    | 6.12    | 7.36    | 6.38    |
| add       | **2.32** | 5.80    | 3.04    | 4.94    | 3.02    |
| update    | **0.460** | 1.06    | 1.22    | 1.32    | 0.700   |
| select    | 0.300   | 0.520   | **0.260** | 0.440   | 0.300   |
| swap      | **0.320** | 6.30    | 0.580   | 1.26    | 0.660   |
| remove    | **0.260** | 0.960   | 0.440   | 0.960   | 0.460   |
| runlots   | **21.2** | 172     | 21.8    | 34.3    | 25.8    |
| clear     | 28.5    | 44.1    | **26.8** | 31.5    | 30.8    |
| reverse   | 1.24    | 2.52    | **0.855** | 1.91    | 17.6    |
| shuffle   | 1.66    | 1.98    | **1.43** | 2.32    | 1.55    |
| rotatef   | **0.049** | 1.97    | 0.139   | 0.568   | 0.139   |
| rotateb   | **0.047** | 0.153   | 0.171   | 0.544   | 0.096   |
| prepend100 | **0.460** | 1.20    | 0.700   | 1.08    | 0.720   |
| append100 | **0.420** | 1.02    | 0.680   | 1.00    | 0.640   |
| insertmid100 | **0.500** | 1.12    | 0.560   | 0.980   | 0.600   |
| removefirst | **0.054** | 0.192   | 0.099   | 0.463   | 0.115   |
| removeevery10 | **0.177** | 0.305   | 0.348   | 0.360   | 0.186   |
| displace3 | 0.139   | 0.195   | 0.211   | 0.534   | **0.131** |
| **total (geo vs torpor)** | **1.00×** | 2.85×   | 1.02×   | 1.39×   | 1.20×   |

Totals are reference-weighted geometric means vs torpor (1.00 = baseline). Best per row in bold.

<!-- /results:auto -->






