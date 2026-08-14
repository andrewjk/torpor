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

| suite             | torpor wins                      | torpor lags                                 |
| ----------------- | -------------------------------- | ------------------------------------------- |
| js-framework      | update 4x                        | runlots 0.71, clear 0.87                    |
| todomvc           | —                                | add100 0.44, edit10 0.24                    |
| chat-stream       | type160 1.6x                     | switchConv 0.21                             |
| dbmon             | —                                | tick 0.39, unmount 0.11                     |
| recursive-context | update_root 3x                   | mount 0.32                                  |
| signal-favoring   | mount 1.76x, bumps 2-13x         | —                                           |
| effectful-list    | update_nodeps 17x                | update_deps 0.05, mount 0.22                |
| memo-wall         | one_change_A 15x, ctx 1.2x       | mount 0.45                                  |
| portal-swarm      | mount_closed 1.7x, dispatch 2.5x | open 0.65                                   |
| list-clear        | all clears 1.3-1.6x              | —                                           |

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

- **Fine-grained updates within `@await` content.** The boundary effect
  re-runs on any dependency change and may re-render content if suspend
  state changed. Non-suspend dep changes (e.g. a toggle inside content)
  are handled by child effects, but the `anySourceSuspended` check walks
  `effect.firstSource` on every run — O(N) in the number of sources.
- **`$refresh` first-read double fetch.** If `fn` reads an `$async` getter that
  the UI has never read, the collection read initializes it (starts a fetch),
  then the refresh re-runs it (second fetch); the first resolve is ignored via
  the generation guard. Normal components always render the getter first, so
  this only affects getters referenced exclusively by `$refresh`.

## Error boundaries — remaining gaps

The recovery trio (effect-rerun error routing, recovery outside direct
reads, top-level `@error` recovery) is fixed via the `t_run_try` runtime
(`render/runTry.ts` + `watch/routeEffectError.ts`): `@try`/`@catch` and
top-level `@error` now register an error boundary on their region, effect
re-run errors are routed to the nearest boundary from `triggerEffects`, and
the boundary holds the erroring effect's source signals so recovery
re-attempts the try branch. Mid-build partial renders are cleared by the
branch switch.

- **Server `t_try_body` snapshot** discards any `t_head` appended before the
  throw (`buildServerCode.ts` / `buildServerTryNode.ts` restore only `t_body`).
  An erroring render that had already appended `<head>` tags leaves them.
- **`@catch` without a preceding `@try`** is silently dropped by the
  parser (matches pre-existing `@else`/`@with`-without-group behavior); no
  error is raised.
- **Hydration dual-branch walk.** When the server renders the catch branch and
  the client's try branch throws, the failed try-branch build advances the
  hydration cursor; `saveHydration`/`restoreHydration` rewind it before the
  catch branch hydrates. If the try branch throws _after_ walking past real
  content (rather than before), the rewind may not fully restore the cursor.

## Dead/duplicated code paths elsewhere

- `src/site/Site.ts:33-35` — design TODOs about whether `defaultAdapter` and
  default plugins are a good idea. Not a HACK to remove; flagged for the
  framework's design discussion.
