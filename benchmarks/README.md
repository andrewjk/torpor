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

2026-11-11 01:27 UTC · interactive report: [view.html](./results/view.html) · archive: [view-…]

Versions: @torpor/view@1.2.6 · react@19.3.1 + react-dom@19.3.1 · solid-js@1.9.19 · vue@3.5.45 · svelte@5.57.3

| op (ms · lower is better) | torpor  | react   | solid   | vue     | svelte  |
|---|---:|---:|---:|---:|---:|
| run       | **2.88** | 48.2    | 3.38    | 5.98    | 4.24    |
| replace   | **5.64** | 50.4    | 6.38    | 8.82    | 7.00    |
| add       | **2.46** | 23.1    | 2.64    | 6.10    | 3.46    |
| update    | **0.420** | 30.7    | 1.34    | 1.70    | 0.900   |
| select    | 0.480   | 6.44    | **0.280** | 0.520   | 0.400   |
| swap      | **0.380** | 23.5    | 0.580   | 1.74    | 0.780   |
| remove    | **0.200** | 7.74    | 0.360   | 1.34    | 0.540   |
| runlots   | **21.0** | 500     | 23.4    | 45.7    | 30.1    |
| clear     | **27.2** | 79.5    | 28.6    | 29.6    | 30.1    |
| reverse   | 1.18    | 4.59    | **0.810** | 1.98    | 19.6    |
| shuffle   | 1.53    | 4.61    | **1.19** | 2.35    | 1.61    |
| rotatef   | **0.048** | 4.11    | 0.133   | 0.776   | 0.147   |
| rotateb   | **0.048** | 1.56    | 0.116   | 0.773   | 0.095   |
| prepend100 | **0.540** | 3.88    | 0.600   | 1.36    | 0.760   |
| append100 | **0.340** | 8.24    | 0.480   | 1.32    | 0.740   |
| insertmid100 | **0.400** | 3.96    | 0.540   | 1.32    | 0.720   |
| removefirst | **0.050** | 2.44    | 0.086   | 0.697   | 0.110   |
| removeevery10 | **0.189** | 0.840   | 0.202   | 0.426   | 0.200   |
| displace3 | 0.142   | 2.50    | 0.156   | 0.777   | **0.123** |
| displace4 | 0.139   | 1.35    | 0.164   | 0.789   | **0.125** |
| displace5 | 0.150   | 1.35    | 0.168   | 0.780   | **0.128** |
| displace6 | 0.147   | 2.49    | 0.170   | 0.783   | **0.129** |
| displace8 | 0.153   | 1.36    | 0.181   | 0.796   | **0.132** |
| **total (geo vs torpor)** | **1.00×** | 7.94×   | 1.08×   | 1.62×   | 1.32×   |

Totals are reference-weighted geometric means vs torpor (1.00 = baseline). Best per row in bold.

<!-- /results:auto -->



