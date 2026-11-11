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

2026-11-11 02:10 UTC · interactive report: [view.html](./results/view.html) · archive: [view-…]

Versions: @torpor/view@1.2.6 · react@19.3.1 + react-dom@19.3.1 · solid-js@1.9.19 · vue@3.5.45 · svelte@5.57.3

| op (ms · lower is better) | torpor  | react   | solid   | vue     | svelte  |
|---|---:|---:|---:|---:|---:|
| run       | **2.92** | 7.78    | 3.20    | 4.92    | 3.64    |
| replace   | **5.48** | 10.4    | 5.60    | 7.42    | 6.14    |
| add       | **2.32** | 5.58    | 2.40    | 4.50    | 2.78    |
| update    | **0.400** | 1.10    | 1.16    | 1.30    | 0.700   |
| select    | 0.520   | 0.760   | **0.160** | 0.480   | 0.280   |
| swap      | **0.360** | 5.94    | 0.580   | 1.62    | 0.720   |
| remove    | **0.240** | 1.000   | 0.340   | 1.04    | 0.500   |
| runlots   | **20.5** | 165     | 21.3    | 32.9    | 23.9    |
| clear     | 27.2    | 42.2    | **27.1** | 29.2    | 29.5    |
| reverse   | 0.985   | 2.21    | **0.915** | 1.49    | 16.6    |
| shuffle   | 1.29    | 1.80    | **1.25** | 1.59    | 1.38    |
| rotatef   | **0.048** | 1.91    | 0.132   | 0.512   | 0.133   |
| rotateb   | **0.047** | 0.146   | 0.116   | 0.506   | 0.090   |
| prepend100 | **0.480** | 1.10    | 0.540   | 0.960   | 0.640   |
| append100 | **0.400** | 0.920   | 0.460   | 0.920   | 0.620   |
| insertmid100 | 0.480   | 1.04    | **0.460** | 0.920   | 0.640   |
| removefirst | **0.058** | 0.163   | 0.081   | 0.441   | 0.104   |
| removeevery10 | **0.183** | 0.308   | 0.208   | 0.350   | 0.191   |
| displace3 | 0.134   | 0.179   | 0.159   | 0.512   | **0.117** |
| **total (geo vs torpor)** | **1.00×** | 2.88×   | 1.02×   | 1.37×   | 1.18×   |

Totals are reference-weighted geometric means vs torpor (1.00 = baseline). Best per row in bold.

<!-- /results:auto -->





