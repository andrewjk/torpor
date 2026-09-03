# Streams — design rationale and future work

`$stream` shipped in `@torpor/view` (see [TORPOR_AGENTS.md](TORPOR_AGENTS.md) for
usage). This document records **why** it is shaped the way it is, the evidence
that informed it, and the roads deliberately not taken — so future contributors
don't have to relitigate them.

---

## Why `$stream` exists

Before `$stream`, the answer to "listen to a server stream" was `$onmount` +
manual cleanup + writing into `$state` — roughly ten lines of error-prone
boilerplate per subscription. Most of that boilerplate is sugar-able, but two
parts are genuinely hard to hand-roll, and they are where the real value sits:

1. **Dep-tracked resubscription.** When `$props.userId` changes, tear down the
   old subscription and open a new one — without leaking the first or racing a
   stale one. Hand-rolling this is the "stale subscription after navigation"
   bug class. In the implementation it comes free: `$stream` pushes a mount
   effect, and mount effects run through `$run`, so reads inside the source
   thunk are tracked and cleanup-before-rerun does the teardown.
2. **SSR safety by construction.** The server stub never invokes the source,
   so `new EventSource(...)` inside a source can't throw during a server
   render. Without this, every external subscription needs a
   `typeof window` guard, and everyone forgets one.

Everything else (the factories, `{ debounce }`) is correctness-and-brevity
sugar. Honest calibration: this is a 90/10 primitive — 90% of the value is
lifecycle + the path from the external world into `$state`; don't oversell it
as "streams in Torpor". The docs show three lines of SSE and stop.

The architectural argument is the stronger one: the realistic alternative to
`$stream` is a user reaching for **rxjs** — a second, foreign state system
fighting the reactive graph, two sources of truth in one component. A small
blessed primitive that pushes external events into `$watch` state keeps one
state system. Frameworks win by making the graph-native path the easy path;
`$stream` is that path for the last major input category that didn't have one
(DOM events → `on*` handlers, fetches → `$async`, external streams → nothing,
until now).

### The three-lane model

Everything in this space lands in one of three lanes, and the API keeps them
separate:

| Lane     | Home                                         |
| -------- | -------------------------------------------- |
| Data     | `$state` (if it has a render/compute need)   |
| Triggers | `on*` handlers, or `fromElement` + `$stream` |
| Timing   | Options on `$stream` / `$run`                |

The counter goes in a closure, not in `$state` — the ick users feel with
`$state.clicked++` pipelines is plumbing pretending to be data. `$state` is
for data; a click counter that exists only to feed a pipeline belongs in the
handler's closure. When the event genuinely _is_ data (`oninput` →
`$state.draft`), the state detour isn't a detour.

---

## Corpus comparison

Research question: does the design cover the functionality people actually use
streams for? Three corpora were surveyed.

### What the corpora use

**RxJS-Playground** (`~/Source/RxJS-Playground` — ~20 demos: animation,
canvas-paint, drag-drop, infinite-scroll, typehead, virtual-list, mario,
real-time, …). Operator frequency across `*.js`:

| Operator    | Uses | Operator               | Uses |
| ----------- | ---: | ---------------------- | ---: |
| `timer`     |  308 | `zip`                  |   46 |
| `filter`    |  251 | `scan`                 |   40 |
| `interval`  |  194 | `reduce`               |   37 |
| `Subject`   |  180 | `combineLatest`        |   37 |
| `map`       |  173 | `BehaviorSubject`      |   36 |
| `merge`     |  141 | `startWith`            |   32 |
| `concat`    |  125 | `ReplaySubject`        |   30 |
| `pluck`     |  113 | `flatMap`              |   23 |
| `expand`    |  110 | `distinctUntilChanged` |   19 |
| `sample`    |  108 | `takeUntil`            |   16 |
| `defer`     |  105 | `groupBy`              |   16 |
| `share`     |   69 | `catchError`           |   10 |
| `fromEvent` |   68 | `partition`            |    7 |
|             |      | `retryWhen`            |    4 |
|             |      | `pairwise`             |    3 |
|             |      | `switchMap`            |    2 |

**learn-rxjs recipes** (`~/Source/learn-rxjs/recipes` — 25 recipes, mostly
games: tetris, breakout, space-invaders, flappy-bird, …; plus type-ahead,
http-polling, save-indicator, stop-watch, lockscreen, swipe-to-refresh,
smartcounter, progressbar). Operator frequency:

| Operator          | Uses | Operator               | Uses |
| ----------------- | ---: | ---------------------- | ---: |
| `fromEvent`       |   83 | `mergeMap`             |   13 |
| `scan`            |   81 | `withLatestFrom`       |   12 |
| `interval`        |   79 | `merge`                |   10 |
| `switchMap`       |   48 | `distinctUntilChanged` |    8 |
| `takeWhile`       |   43 | `throttleTime`         |    6 |
| `combineLatest`   |   25 | `expand`               |    5 |
| `BehaviorSubject` |   22 | `debounceTime`         |    5 |
| `takeUntil`       |   19 | `timer`                |    3 |
| `Subject`         |   17 |                        |      |

**Combine** (Apple): publishers/subscribers, Subjects
(`PassthroughSubject`/`CurrentValueSubject`), `@Published`/`ObservableObject`,
Foundation publishers (Timer, NotificationCenter, URLSession, KVO), operators,
schedulers, backpressure (Demand), `AnyCancellable`, connectable publishers,
`AsyncPublisher`.

### Mapping to the design

| Corpus concept                                        | In the design                                                                                                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `fromEvent`, EventSource, timers                      | `fromElement` / `fromServer` / `fromWebSocket` factories; `interval`/rAF sources are equally trivial to write                                    |
| `debounceTime`, `throttleTime`, `sample`, count gates | `{ debounce }` option; `throttle`/`{ every: N }` kept in reserve (arity-preserving, cheap to add)                                                |
| Subjects, `BehaviorSubject`, `CurrentValueSubject`    | `$watch` **is** the subject — the handler pushes into state; current-value semantics for free                                                    |
| `@Published` / `ObservableObject`                     | already `$watch` + components                                                                                                                    |
| `scan`, `reduce`, `pairwise`, `groupBy`, `pluck`      | closures in the handler / computeds over pushed state — plain JS, no operator                                                                    |
| `merge`                                               | two `$stream`s pushing into the same state keys                                                                                                  |
| `combineLatest`, `withLatestFrom`                     | **the graph is the combinator** — handlers write keys; any `$run`/computed reading several keys gets latest-of-all semantics with zero operators |
| `switchMap`/cancel-in-flight (type-ahead)             | `$async`'s generation guard + `AbortController` in the source thunk                                                                              |
| `takeUntil` (stop on game over)                       | read `$state.gameOver` inside the source (dep-tracked resubscribe) or guard the handler                                                          |
| `share` / connectable publishers                      | mount-driven lifecycle + multiple template readers of the same state key — free                                                                  |
| Schedulers (Combine)                                  | N/A in JS (single-threaded); `$batch` covers coalescing                                                                                          |
| Backpressure/Demand (Combine)                         | deliberately absent — UI streams don't backpressure; `$state` absorbs bursts                                                                     |
| `AnyCancellable`                                      | automatic region cleanup                                                                                                                         |

The meta-pattern: **`scan` + subjects + `combineLatest` dominate both corpora
because RxJS has no persistent state layer** — operators simulate one. Torpor's
`$watch` absorbs that entire operator family. Even the game recipes are really
"interval + a state machine"; here that's an interval StreamSource (or `$run` +
rAF) mutating `$state`, which is arguably clearer than `scan`-folding.

Verdict by recipe: type-ahead, http-polling, save-indicator, stop-watch,
progressbar, lockscreen, swipe-to-refresh, smartcounter — all covered cleanly.
Games — covered with rAF + state. Combine — its distinctive residue
(backpressure, schedulers) is stuff a DOM framework doesn't want anyway.

### Honest gaps

1. **`zip`/`concat`** — strict pairing/sequencing across streams. No natural
   home in push-into-state; also rarely needed in UI. If ever needed:
   userland operator.
2. **Error channel** — `StreamSource` is `(push) => cleanup`; there is no
   `fail`. Current rule (documented in JSDoc): errors are values, and sources
   own their reconnection (`EventSource` reconnects automatically). Revisit if
   wrapper sources (retry/backoff) become common.
3. **Generic higher-order mapping** (`switchMap` over arbitrary sources) —
   not expressible without observables-as-values. Call it a non-goal: it is
   the point where the graph model and RxJS part ways. Fetch-shaped
   cancellation is solved by `$async`'s generation guard.
4. **`fromElement` and unstable elements** — the subscription dereferences the
   getter once at (re)subscribe time, so the element must be stably mounted.
   For `@if`-gated elements, put the `$stream` in whatever component owns the
   conditional. (Making refs trackable would be a rabbit hole; don't.)

---

## Future: pipes, pipe helpers, combinators

The question that kept resurfacing during design: shouldn't there be a
pipeline? E.g. `$stream(source, handler, [buffer(s, 3)])`?

That is RxJS's `pipe([...operators])` with square brackets. It was declined —
but not because combinators are wrong. It's because **the `StreamSource`
design makes combinators free, as plain functions**, so the framework ships
none of them until real usage demands it.

### Combinators are just functions

A combinator is a `StreamSource → StreamSource` function. Because
`StreamSource` is a plain function type, the entire combinator is:

```ts
function everyN<T>(n: number, source: StreamSource<T>): StreamSource<T> {
	let count = 0;
	return (push) =>
		source((v) => {
			if (++count === n) {
				count = 0;
				push(v);
			}
		});
}
```

Usage: `everyN(3, fromElement(btn, "click"))`. Composition works by nesting, or
by a three-line pipe helper if nesting gets old.

### The pipe helper (when wanted)

Curried operator style:

```ts
type Operator<T, U> = (source: StreamSource<T>) => StreamSource<U>;

function pipe<T>(source: StreamSource<T>, ...ops: Operator<any, any>[]): StreamSource<any> {
	return ops.reduce((s, op) => op(s), source);
}
```

```ts
$stream(pipe(fromElement(btn, "click"), everyN(3)), (e) => save());
```

Reads left-to-right like RxJS. **The caveat is the typing**: `Operator<any,
any>` dodges the real work — a fully-typed heterogeneous pipe
(`Stream<T> → Stream<U> → Stream<V>`) is where the actual lines live (RxJS's
`pipe` overloads are famously gnarly). That typing burden is the honest reason
to keep this in userland until a use case proves the investment worth it.

### The tiering that keeps the surface small

- **Options** (`{ debounce }` today; `throttle`, `{ every: N }` in reserve) —
  the boring 80%, no composition semantics, built in. governed by the arity
  principle above.
- **Combinators** — userland functions the type enables, for stateful
  patterns (windowing, aggregation, time windows). The framework ships zero.
- **Pipeline syntax** — don't add until semantics settle; if some array form
  ever earns its keep, it is pure sugar over function composition and can be
  added later without breaking anything.

Criteria for promoting anything into core: it shows up repeatedly in real
apps, it survives the arity principle, and it can't be a five-line closure or
five-line userland operator.

### Related future work

- **`$run(fn, { debounce })`** — debounced _state-triggered_ effects
  (autosave-on-type). Expressible today with `$run` + timer cleanup
  (cleanup-before-rerun _is_ the debounce), but the option needs a
  scheduler-level hook in `triggerEffects` — a separate change, tracked in
  `$run.ts`'s TODO and FOLLOWUP.md.
- **`interval`/`timer`/rAF factories** — trivial StreamSources; ship when a
  use case (polling, game loop) asks.
- **Timing options** — `throttle` and `{ every: N }` are closure-trivial and
  arity-preserving; add on demand. Options are easy to add and hard to
  remove, so start minimal.
