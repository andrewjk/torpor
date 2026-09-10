# Async — design rationale and future work

`$async`, `@await`/`with`, `$pending`/`$refresh`, `@try`/`@catch`/`@error`, and
`source: "server"` shipped in `@torpor/view` (see [TORPOR_AGENTS.md](TORPOR_AGENTS.md)
for usage). This document records **why** the async model is shaped the way it
is, the evidence that informed it, and the roads deliberately not taken — so
future contributors don't have to relitigate them.

---

## Why the model exists

The original `@await (promise) { … } then (value) { … } catch (e) { … }` was a
runtime-only control: it tore down and re-rendered on every promise
reassignment, coupled the loading UI to the value in one block, and could only
await one promise per component. Against the `async-waterfall` benchmark (10
nested levels × 16ms simulated fetch), it sat at ~11× the parallel floor — the
same place React's nested `use()` sits. A compiler transform (hoisting
independent fetches, octane-style) could have bought the benchmark number back,
but it would have been optimizing a model structurally less capable than what
Solid 2.0 and Svelte 5.36 had already shipped. The honest upgrade was a model
change, not a transform.

### The waterfall is an authoring shape

Frameworks split into two families by one question: **does the child mount only
after the parent's promise resolves?**

| Family                       | Child location                                   | Result              | Examples                                          |
| ---------------------------- | ------------------------------------------------ | ------------------- | ------------------------------------------------- |
| A — suspend then mount       | inside `then`                                    | serial by structure | React `use()` + Suspense; the old torpor `@await` |
| B — tree created immediately | sibling of the await; only the value text awaits | parallel by model   | Solid 2.0, Svelte 5, ripple                       |
| A + compiler hoist           | inside `then`, but fetches hoisted               | parallel anyway     | octane (`__warm` plans + warm-harvest)            |

The takeaway that drove everything else: **the waterfall is not inherent to any
runtime — it's where the child sits relative to the await.** Truly dependent
fetches (fetch project, then its owner) should waterfall; independent fetches
nested inside `then` are an authoring mistake, and a transform that rescues
them is a band-aid. Family B gets parallelism for free, which is why the
benchmark number was never the goal — the model was. With the shipped model,
the fixture lands at the parallel floor (init ≈ 1.2×, update ≈ 1.1×, vs octane's
hoisted 1.3–1.4×) without any per-level authoring care: nesting doesn't
serialize because a boundary's speculative content render pre-fetches child
boundaries.

### The model change

Async is a **computation, not a control block** — the Solid direction. A getter
whose result is a Promise is marked with `$async`; reads of it participate in
the reactive graph; the boundary that renders the not-ready state is separate
from the value.

| Primitive             | Role                                                  | Replaces                            |
| --------------------- | ----------------------------------------------------- | ----------------------------------- |
| `$async(fn)`          | suspendable cached getter (peer of `$cache`)          | `@await`'s value binding            |
| `@await { } with { }` | boundary: first-load pending state                    | `@await`'s pending/then branches    |
| `$pending(fn)`        | inline refresh indicator (loud suspends only)         | —                                   |
| `$refresh(fn)`        | re-fetch with no dependency change (loud default)     | —                                   |
| `@try`/`@catch`       | error boundary — sync throws **and** async rejections | `@await`'s `@catch`                 |
| `@error (err)`        | component-level catch-all                             | boilerplate `@try` around `@render` |

---

## The promise indicator

The piece of hidden machinery everything else stands on: a `didSuspend` flag on
the `Computed` that `$async` creates. The proxy get trap reads it beside the
existing `didError`/`recalc` indicators; a read that hits it returns a
placeholder, taints the active reader up the cache chain, and notifies the
nearest `@await` boundary through `context.awaitBoundary` — the same
set-flag-and-drain-through-the-graph shape as `$onmount`'s mount effects.

**Suspend is data, not control flow.** The alternative — throwing a
`PromiseNotReady` and catching it at the boundary — reuses the error cache for
free, but puts an exception on every reactive read of a pending promise:
pause-on-exceptions trips constantly in the debugger, V8 throw overhead lands
on the hot path, and user code under `@await` needs fragile `instanceof`
checks. With the flag, suspend and error never meet at the same throw site:
`@try` catches errors, `@await` catches suspends.

- **`$cache` and `$async` are peers** — one or the other per getter, never both.
  There is no static check (the template compiler emits expressions verbatim; a
  type-level check would need TypeScript's checker). Instead `$cache` throws at
  runtime if its getter returns a thenable: a promise cached by `$cache` would
  render as `[object Promise]`, so the guard catches it at first read.
- **Reads outside a boundary return `undefined`** (first load) or the previous
  resolved value (refresh) — the undefined-then-recover contract. It's
  load-bearing: `$refresh`-driven views and plain template reads work without a
  wrapper because of it. The rule that comes with it: don't use a first-load
  read's value as data — gate on it, use `$pending`, or put it in a boundary.
- **Effects don't suspend.** Deferring an effect body until resolve was
  rejected: side effects can't be speculatively run and rolled back the way a
  boundary's render can. A crashed effect re-subscribes through
  `Effect.suspendSources`, so the resolve re-runs it.

---

## Stale-while-revalidate

Once a boundary has produced content, a subsequent suspend **keeps the stale
content mounted** instead of flashing the fallback. First-load pending is the
boundary's job; refresh pending is an inline `$pending` indicator's job — Solid
and Svelte converged on this split independently, and it's what the
transition gate requires.

- **On each re-run the boundary only decides whether to switch branches**,
  from its `pending` set of suspended computeds — O(pending reads), never a
  walk of all sources. Resolved entries drop out; still-suspended ones
  re-subscribe the boundary effect.
- **A boundary commits only when nothing inside suspends.** Two pending reads
  in one boundary hold the `with` branch until both resolve; siblings fill
  incrementally.

### Loud vs quiet

A suspend is _loud_ (a first load, a dependency-change refresh, a default
`$refresh`) or _quiet_ (a `$refresh(fn, { silent: true })` background
revalidate — re-asking the same question shouldn't ping the user). `$pending`
returns `true` only for loud suspends. Loudness is captured at suspend time
from `hasResolved && !recalc`, so `$pending` needs no per-source
configuration.

### Generation guards

Every run of an `$async` computed takes a new promise (generation++), and only
the latest generation's settle handler writes value/error. This handles rapid
prop changes on both sides:

- **Resolve side:** a superseded fetch's result is dropped, and because
  `$async` attaches handlers to every promise it adopts, its rejection is
  consumed — no `unhandledrejection`.
- **Read side:** the value retained during a refresh suspend
  (`Computed.staleValue`) is maintained by those same generation-guarded settle
  handlers — never derived from `computed.value` at suspend time, which (when
  runs overlap) is the superseded run's _pending promise_ and rendered as
  `[object Promise]`.

After a rejection the stale value is cleared, so a retry reads as a first load.
The thunk's return value is the unit of suspension — no per-source key, no
promise cache, no revalidate-on-mount, no TTL. Same tracked inputs never
re-run; changed inputs are exactly when a fresh fetch is wanted. Coalescing and
sharing are author-level plain JS (return a memoized promise from the thunk).

---

## Corpus comparison

Research question: does the shipped model cover what the newer async designs
actually do, without their costs?

### What each ships

**Solid 2.0** — no `createResource`: any computation may return a Promise;
reads auto-unwrap and throw `NotReadyError`, caught by `createLoadingBoundary`.
`Loading` is branch-readiness (stale content stays mounted through
revalidation). `isPending(fn)` splits first-load from refresh; a bare
`refresh()` is quiet unless declared `affects(x); refresh(x)`. Per-primitive
SSR policy (`ssrSource: "server" | "hybrid" | "client"`, `deferStream`,
`transparent`). One error path. Helpers: `latest`, `resolve`, `loadingValue`.

**Svelte 5.36** — the other bet: JS `await` works in templates and `$derived`.
Independent awaits auto-parallelize; the compiler **warns** (`await_waterfall`)
on accidental serialization instead of transforming it. `<svelte:boundary
pending>` owns first paint; `$effect.pending()` drives refresh indicators.
Synchronized updates (state changes don't render until the async settles).
`fork()` for intent-based preloading; `settled()` for tests. `await render()`
SSR; streaming planned.

**React 19** — `use(fetch)` + Suspense: Family A authoring, serial when
nested (~19× on the fixture). Automatic parallel-`use` hoisting is pursued
upstream but the shape remains structural.

**octane** — same authoring, made parallel by compiler-emitted `__warm` plans
that the runtime harvests on first suspend: the only suite member that
parallelizes Family A, and proof that the fix is orthogonal to the model.

**Vue Vapor** — Solid-like (fine-grained shallowRef + immediate tree); not in
the fixture suite.

### Mapping to the design

| Their concept                           | In torpor                                                                                                                              |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Computation returning a Promise (Solid) | `$async` getter — opt-in rather than automatic (deliberate: no static analysis; `$cache` guard instead)                                |
| `Loading` branch-readiness              | `@await`/`with` + `hasContent`                                                                                                         |
| `isPending` / `$effect.pending`         | `$pending` — same first-load/refresh split                                                                                             |
| quiet bare `refresh()`                  | `$refresh(fn, { silent: true })`; loud by default is torpor's only divergence (pull-to-refresh wants a spinner without extra ceremony) |
| `await_waterfall` warning               | obsolete — independent reads parallelize by construction; only genuine data dependencies serialize                                     |
| `ssrSource`                             | `$async(fn, { source: "server" })` — per-getter, same axis                                                                             |
| `<svelte:boundary pending>`             | `with` branch                                                                                                                          |
| one error path (Errored / boundary)     | `@try`/`@catch` + `@error` — suspend never reaches them                                                                                |
| `fork()` / `settled()` / `latest()`     | not shipped (see Future work)                                                                                                          |
| synchronized updates                    | the boundary's branch switch + generation guards give the same user-visible behavior                                                   |

### Honest gaps

1. **Opt-in, not automatic.** A promise-returning getter without `$async`
   throws at first read. Runtime-guarded, not compiler-checked — the honest
   cost of not running TypeScript's checker in the template compiler.
2. **Rejections can't be positioned in server HTML.** A server fetch that
   rejects degrades the boundary to its `with` branch; the error surfaces
   through the client's `@try` after hydration (sync `@try` errors still
   render server-side).
3. **Server reads re-run per read**, like `$cache` on the server — two
   interpolations of one getter start two fetches. Coalescing is a one-line
   memoize in the thunk, by design (see Generation guards): a framework key would
   move caching policy into the framework and fight stale-while-revalidate.
4. **Server content renders twice** (collect + render pass) — keep side
   effects out of render, as anywhere.
5. **JSON-safe values only** for `source: "server"` (they travel in a comment
   payload).
6. **Sibling components serialize** on the server: each component's flush
   awaits its own boundaries before returning. Fetches parallelize within a
   render and down the nested-children descent; deferring component renders
   like boundaries are is the fix (streaming-adjacent).
7. **The long tail has no helpers** — Solid's `latest`/`resolve`/
   `loadingValue`, Svelte's `settled`. Plain closures cover most; ship when
   asked.

---

## Server rendering

Default is client-fetch: `$serverAsync` never runs the thunk, the boundary
renders its `with` branch, the fetch starts after hydration. That default is
not an oversight:

- **The shell ships immediately** — a slow widget must not hold the response
  hostage.
- **Failure isolation** — a flaky fetch fails inside the boundary on the
  client, with `@try` and a retry button, instead of becoming a 500 for the
  page.
- **Retry is naturally client-side**; a server hold needs a timeout policy
  just to recover.

`source: "server"` opts a getter in. As implemented
(`packages/view/src/ssr/runServerAwait.ts`, `serverSentinels.ts`):

1. **Two-pass render.** A collect pass renders the boundary's content
   speculatively purely to invoke its getters — every `source: "server"` read
   calls its thunk and records the promise, so siblings start in one wave; the
   pass's output is discarded. After a settle (per-getter `timeout`, default
   5000ms), a render pass re-renders content consuming the settled values
   through a cursor in read order, without re-calling the thunks.
2. **Detached lifecycle.** The boundary helper returns a sentinel comment
   immediately (blocking the enclosing render would serialize sibling
   getters); the flush substitutes the finished HTML at the end. Nested
   boundaries re-invoke the helper in the enclosing render pass, which awaits
   the already-running nested lifecycle by occurrence key — no nested
   re-fetch.
3. **Resolved delivery.** Content ships wrapped in the boundary's hydration
   markers plus a `<!--t-await:[...]-->` payload (the values as JSON, in read
   order, `-->` escaped).
4. **Degrade to `with` + client fetch** on any instability: settle timed out,
   the render pass doesn't replay the collect pass exactly (different read
   count, unknown nested boundary — branch structure that depends on the
   async values), a client-fetch getter was read (the client would suspend on
   it), or a read rejected. Degradation is the honest output, not a failure —
   it is exactly the default path.
5. **Hydration.** `runAwait` reads the payload after the anchor; `$async`
   seeds its computed from it — the server's HTML is adopted directly, no
   fallback flash, no blocking re-fetch. The thunk still runs once in the
   background so dependency changes re-fetch; that in-flight result is
   dropped by the generation guard.

`source` names where the value comes from — deliberately not _how it travels_.
Await-and-embed shipped; streaming delivery can replace the transport without
the option changing.

---

## Roads not taken

- **Throw-based suspend** (`PromiseNotReady` riding `didError`) — free error
  cache, but an exception on every pending read: debugger noise, throw
  overhead, `instanceof` checks in user code. The flag costs one boolean and
  one branch (see The promise indicator).
- **Compiler promise tracking** (a `t_track_promise` wrapper throwing at every
  promise read) — more machinery than the model needs, and it puts the
  exception cost back. The cache was already the natural registration point.
- **Option B: hoisting nested awaits at compile time** — buys the benchmark
  number without addressing the structural gaps, preserving a model Solid and
  Svelte had already obsoleted. Superseded by the model change.
- **A framework-level resource key / promise cache** — the reactive graph
  already provides identity ("same tracked inputs never re-runs"), and a keyed
  cache returning completed promises would disagree with the boundary's
  keep-stale rule about what "the current value" is mid-revalidation.
- **Bare effects suspending** (deferring the body until resolve) — side
  effects can't be rolled back like a speculative render; the contract
  `$refresh` views are built on would change.
- **The old `@await (p) … then (v) … catch (e)` control** — removed once the
  boundary shipped; the parser errors on it pointing at the migration.
- **`@finally`** — no declarative use case; Solid and Svelte don't ship one.
- **Async-only server components** — the static analysis (which components can
  render an async child) is unsound across files and dynamic calls, and the
  measured cost of "every server component is async" is single-digit
  nanoseconds per render. Uniform shape wins.

---

## Measured

- **Waterfall** (10 levels × 16ms; fixture since removed): old model ~11× the
  parallel floor; shipped model init ≈ 20ms (1.2×), update ≈ 18ms (1.1×);
  octane's compiler hoist 1.3–1.4×.
- **Taint propagation** (`test/bench/suspendTaint.bench.ts`): reads of a
  suspended computed flip `didSuspend` up the cache chain, O(depth) per read —
  measured flat at ~900–1000 ns per effect re-run from chain depth 1 through
  100, suspended within ~5% of resolved. The flips are unmeasurable against
  the reactive read, which is itself O(depth).
- **Non-async overhead**: server components are now `async` functions — a few
  ns per render (one resolved promise), measured; the client hot paths
  (proxy reads, effects, `$watch`, mounting) are untouched.

---

## Future work

1. **Streaming delivery** — the transport half of `source: "server"`: render
   the `with` branch, patch replacements as promises resolve. Needs
   multi-state hydration markers (the current scheme assumes one branch per
   boundary), streaming-capable adapters, and pre-flush status/redirect
   decisions. The option name stays.
2. **Deferred component renders** — stash component renders the way boundaries
   are, so a later sibling component's fetches don't wait for an earlier one's
   flush. Same machinery streaming needs; do them together.
3. **`@await on ($props.id)`** — opt back into re-showing the `with` branch on
   key-level changes, for the cases where stale content would be wrong rather
   than stale-friendly. Designed; not yet parsed/built.
4. **`fork()`-style intent-based preloading** — speculatively start async work
   on a hover/focus hint, `commit()` or `discard()` on what the user does.
   Genuinely novel in Svelte; no torpor equivalent. Needs a story for where
   the speculative value lands (a non-reactive side channel is the likely
   answer).
5. **`@pending (fn) { … }` sugar** — pure sugar over `@if ($pending(fn))`;
   add when ergonomics demand (it can't drive attributes, so `$pending` the
   function stays primary).
6. **Top-level `@await`** as a sibling of `@render` — symmetric with
   `@error`, for the "whole component is loading" case. Loading fallbacks are
   usually layout-specific, so `@error` shipped first; revisit if boilerplate
   complaints emerge.
7. **Long-tail helpers** — `latest`-style peek during transitions,
   `settled()`-style drain for tests, `loadingValue`-style first-paint
   declaration. Plain closures cover most; each must earn its way in by
   showing up repeatedly in real apps and not being a five-line closure.

Criteria for promoting anything above: it survives contact with real usage,
it can't be plain JS the graph already enables, and it doesn't grow a second
invalidation/caching model next to the reactive graph's.
