# Follow-ups

Items that were noticed and deliberately left out of scope of a previous change.
Each entry should describe what was seen, where, and any relevant context.

## Benchmark porting (torpor fixtures)

Torpor fixtures exist for the 12 server-backed suites and pass their gates via
`node benchmarks/bench.mjs --quick <suite>`: js-framework, todomvc, chat-stream,
dbmon, recursive-context, signal-favoring, effectful-list, memo-wall,
portal-swarm, async-waterfall, list-clear, async-composition. Each lives in
`benchmarks/<suite>/torpor-*` and the harness default TARGETS + bench.mjs
`servers` entries were updated.

### Not-portable suites (torpor's model can't satisfy the gate)

- **SSR / streaming suites** (ssr-throughput, streaming-ssr, ssr-http,
  streaming-backpressure, ssr-workerd, tanstack-start) — measure octane's
  `renderToPipeableStream`/`prerender` streaming APIs; torpor's SSR
  (`@torpor/build` Site/Server) is a different architecture, not
  apples-to-apples.
- **octane-internal/compiler suites** (codegen-size, compiler-throughput,
  dbmon-deopt, js-framework-deopt, react-hosted-islands) — measure octane's
  compiler output / deopt cliff; torpor has its own compiler.
- **octane-only integrations** (three-_, lynx-_, weather-app-lighthouse
  needs review) — no torpor three/lynx runtime.
- **build-based news/hydration/runtime-stress suites** — need a full
  `news/torpor` SSR fixture + harness TARGETS updates; deferred (see the
  "everything feasible" option).

Note: the checked-in `octane-tsrx` async-composition fixture fails its own
observation ceiling in this tree (13 update calls vs its recorded 8) — an
environment/build drift unrelated to torpor's port.

### Observed perf gaps (torpor vs octane, same harness, quick)

| suite             | torpor wins                      | torpor lags                  |
| ----------------- | -------------------------------- | ---------------------------- |
| js-framework      | update 4x                        | runlots 0.71, clear 0.87     |
| todomvc           | —                                | add100 0.44, edit10 0.24     |
| chat-stream       | type160 1.6x                     | switchConv 0.21              |
| dbmon             | —                                | tick 0.39, unmount 0.11      |
| recursive-context | update_root 3x                   | mount 0.32                   |
| signal-favoring   | mount 1.76x, bumps 2-13x         | —                            |
| effectful-list    | update_nodeps 17x                | update_deps 0.05, mount 0.22 |
| memo-wall         | one_change_A 15x, ctx 1.2x       | mount 0.45                   |
| portal-swarm      | mount_closed 1.7x, dispatch 2.5x | open 0.65                    |
| list-clear        | all clears 1.3-1.6x              | —                            |

The recurring lag pattern: **per-row mount cost** (dbmon/memo-wall/effectful-list
mount) and **fine-grained update wins** (signal-favoring, recursive-context
update_root, update_nodeps). (async-waterfall previously lagged at ~0.13× from
the old `@await` waterfall; the Stage C model change put torpor at the parallel
floor — ASYNC.md §7.)

## Async model — remaining gaps

Stage A (`@try`/`@catch`, top-level `@error`), Stage B (`$async`, `@await`/`with`
boundary, `$pending`, `$refresh`), and Stage C (old `@await (p) {…} then (v) {…}`
control removed; `@loading`/`@fallback` renamed to `@await`/`with`) are shipped
(ASYNC.md §7.7).

## Dead/duplicated code paths elsewhere

- `src/site/Site.ts:33-35` — design TODOs about whether `defaultAdapter` and
  default plugins are a good idea. Not a HACK to remove; flagged for the
  framework's design discussion.

## Preview of built page sites fails at runtime (pre-existing)

`tb --preview` on page-based examples (`examples/demo`, `examples/mini`) returns
`{"code":"ERR_MODULE_NOT_FOUND"}` / `{"code":"ERR_UNKNOWN_FILE_EXTENSION"}` from
`dist/server/serverEntry.js` — its runtime imports (e.g. `.torp` route files)
aren't resolvable by plain Node. Reproduces at HEAD without the endpoints-only
site.html fix. Dev mode (`tb --dev`, which uses `vite.ssrLoadModule`) works fine.
