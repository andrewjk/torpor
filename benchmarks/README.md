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

2026-11-11 21:09 UTC · interactive report: [view.html](./results/view.html) · archive: [view-…]

Versions: @torpor/view@1.3.0 · solid-js@1.9.19 · svelte@5.57.3 · vue@3.5.45 · react@19.3.1 + react-dom@19.3.1

| op (ms · lower is better) | torpor  | solid   | svelte  | vue     | react   |
|---|---:|---:|---:|---:|---:|
| run       | **2.24** | 2.30    | 2.66    | 3.88    | 5.48    |
| replace   | **4.78** | 5.18    | 5.74    | 6.86    | 11.4    |
| add       | **2.36** | 2.40    | 2.78    | 4.40    | 5.66    |
| update    | **0.300** | 1.00    | 0.600   | 0.940   | 1.00    |
| select    | **0.180** | 0.200   | 0.220   | 0.300   | 0.520   |
| swap      | **0.180** | 0.320   | 0.440   | 1.10    | 5.60    |
| remove    | **0.140** | 0.300   | 0.400   | 0.780   | 0.840   |
| runlots   | **20.6** | 21.2    | 24.2    | 33.8    | 174     |
| clear     | **28.3** | 28.3    | 29.3    | 36.7    | 43.2    |
| reverse   | 1.26    | **0.825** | 17.0    | 2.08    | 2.49    |
| shuffle   | 1.38    | **1.11** | 1.54    | 2.35    | 1.74    |
| rotatef   | **0.047** | 0.135   | 0.140   | 0.575   | 2.01    |
| rotateb   | **0.049** | 0.135   | 0.092   | 0.683   | 0.157   |
| prepend100 | **0.440** | 0.540   | 0.620   | 0.980   | 1.20    |
| append100 | **0.380** | 0.640   | 0.620   | 1.00    | 0.960   |
| insertmid100 | **0.440** | 0.680   | 0.640   | 0.960   | 1.12    |
| removefirst | **0.060** | 0.088   | 0.112   | 0.465   | 0.181   |
| removeevery10 | **0.181** | 0.202   | 0.205   | 0.377   | 0.363   |
| displace3 | 0.140   | 0.165   | **0.119** | 0.526   | 0.182   |
| **total (geo vs torpor)** | **1.00×** | 1.02×   | 1.18×   | 1.51×   | 2.95×   |

Totals are reference-weighted geometric means vs torpor (1.00 = baseline). Best per row in bold.

<!-- /results:auto -->






