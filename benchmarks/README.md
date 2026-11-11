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

2026-11-11 01:40 UTC · interactive report: [view.html](./results/view.html) · archive: [view-…]

Versions: @torpor/view@1.2.6 · react@19.3.1 + react-dom@19.3.1 · solid-js@1.9.19 · vue@3.5.45 · svelte@5.57.3

| op (ms · lower is better) | torpor  | react   | solid   | vue     | svelte  |
|---|---:|---:|---:|---:|---:|
| run       | **2.72** | 52.1    | 3.34    | 6.08    | 4.36    |
| replace   | **5.66** | 49.9    | 6.16    | 8.68    | 7.10    |
| add       | **2.34** | 23.7    | 3.44    | 6.12    | 3.48    |
| update    | **0.440** | 30.3    | 1.22    | 1.64    | 0.800   |
| select    | 0.380   | 6.06    | **0.280** | 0.440   | 0.400   |
| swap      | **0.360** | 24.2    | 0.460   | 1.96    | 0.860   |
| remove    | **0.220** | 7.62    | 0.360   | 1.18    | 0.580   |
| runlots   | **21.0** | 517     | 23.5    | 46.2    | 30.8    |
| clear     | **27.8** | 73.8    | 29.3    | 30.3    | 30.9    |
| reverse   | 1.20    | 4.64    | **1.05** | 2.15    | 19.9    |
| shuffle   | 1.56    | 7.42    | **1.01** | 2.44    | 1.66    |
| rotatef   | **0.048** | 4.23    | 0.145   | 0.786   | 0.150   |
| rotateb   | **0.050** | 1.52    | 0.122   | 0.778   | 0.096   |
| prepend100 | **0.440** | 4.10    | 0.620   | 1.32    | 0.800   |
| append100 | **0.360** | 8.48    | 0.500   | 1.32    | 0.760   |
| insertmid100 | **0.540** | 4.12    | 0.620   | 1.34    | 0.860   |
| removefirst | **0.062** | 2.53    | 0.091   | 0.706   | 0.116   |
| removeevery10 | 0.184   | 0.806   | 0.201   | 0.450   | **0.176** |
| displace3 | 0.140   | 1.37    | 0.162   | 0.802   | **0.133** |
| **total (geo vs torpor)** | **1.00×** | 7.71×   | 1.09×   | 1.61×   | 1.35×   |

Totals are reference-weighted geometric means vs torpor (1.00 = baseline). Best per row in bold.

<!-- /results:auto -->




