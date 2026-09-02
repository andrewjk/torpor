# build benchmarks

Server-side benchmark comparing `@torpor/build` request handling with Express,
Hono, Fastify and Elysia. Adapted from `hono/benchmarks/fetch` (route
contract) and `bun-http-framework-benchmark` (real-HTTP autocannon
methodology), trimmed so a full run takes well under a minute.

Every framework serves the same contract:

- `GET /` → `Hi` (text)
- `GET /id/42?name=bench` → `42 bench` + `x-powered-by: benchmark` header
- `GET /user` → `{"id":123,"name":"Alice","roles":["admin","editor"]}`
- `POST /json` → echoes the JSON body

Each case is verified against the expected response before it is measured, so
a silently broken route can't win.

## Running

```sh
pnpm bench                    # from this folder; 1s per case, 100 connections
DURATION=5 pnpm bench         # longer, less noisy
FRAMEWORKS=torpor,hono pnpm bench
CASE=query pnpm bench         # cases starting with "query"
--rebuild                     # force a fresh torpor build
BENCH_JSON=path               # also write machine-readable results
```

The runner starts each framework server on `127.0.0.1` (own port per
framework), runs a short discarded warmup, then measures with autocannon. The
torpor fixture (`servers/torpor`) is an endpoints-only site built once with
`tb --build` and served through the same production path as `tb --preview`
(`serverEntry.load` via the node adapter).

If a framework fails to start (e.g. the Elysia node adapter
`@elysia/node` changes) it is skipped with a warning rather than failing the
run. Total time is roughly `frameworks × cases × (DURATION + 0.3s warmup)` —
about 30s at the defaults.
