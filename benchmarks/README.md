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
