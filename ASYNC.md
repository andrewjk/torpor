# Async data & the waterfall: analysis

Notes on torpor's async story vs the other frameworks, grounded in the
`async-waterfall` benchmark fixture (`benchmarks/async-waterfall`) and octane's
runtime source (`node_modules/octane/dist/universal-core.js`). This is an
analysis doc — no decisions made here yet.

---

## 1. What the benchmark measures

10 nested async levels (`Level` 0..9), each with its own `fetchData(level,
version)` call and 16ms simulated latency (cached per `level:version` in
`src/data.js`). A level renders a `.level` div whose `.val` span shows the
fetched text, and (unless it's the deepest) a child `Level`.

- **waterfall floor** = `LEVELS × DELAY` = 160ms (fetches serialize: level N+1
  can't start until level N resolved)
- **parallel floor** = `DELAY` = 16ms (all fetches start in wave 0)

The measured ops are `init` (cold mount → deepest level rendered) and `update`
(version bump → deepest level shows the new value).

Recorded torpor numbers (quick mode): `init` ≈ 170ms (11×), `update` ≈ 155ms
(9.7×). Octane: `init` ≈ 22ms (1.4×), `update` ≈ 19.6ms (1.2×).

---

## 2. Two families of async models

Frameworks split into two families based on **whether the child mounts only
after the parent's promise resolves**.

### Family A — "suspend then mount children" (waterfall by structure)

The child is created _inside_ the resolved branch, so level N+1 doesn't mount
(and therefore doesn't call `fetchData`) until level N's promise resolved:

- **React** (`use(fetch)` + `Suspense`) — canonical nested-`use` waterfall.
  React 19 is pursuing automatic parallel-`use` hoisting, but as shipped in
  this fixture it's serial (~19× the floor).
- **Octane** (`use(fetch)` + `Suspense`) — same authoring as React, but the
  **compiler hoists** the fetches up-front → ~1.3×. The only framework in the
  suite that parallelizes Family A authoring.
- **Torpor** (`@await`) — structurally identical to React's authoring: the
  recursive `<Level>` sits inside the `@await`'s `then` branch, so it
  waterfalls (~11×). No compiler hoist.

### Family B — "tree created immediately, data fills in" (parallel by model)

Children are created regardless of data; only the _value text_ waits:

- **Solid 2.0** — `createMemo(() => fetchData(...))`; reads auto-unwrap and
  throw `NotReadyError`, caught by `createLoadingBoundary` wrapping **only the
  value span**. The child `<Level>` renders unconditionally below it → all 10
  fetches start in wave 0 (~1.2×). Solid 2.0 has first-class async: exactly
  this.
- **Ripple** — `track()`ed string seeded with a placeholder, plus an effect
  that writes the resolved value in place when `version` changes. The tree is
  created immediately → parallel (~1.2×).
- **Svelte 5** — `{#await fetchData(level, version)}` per level, but the
  recursive child is a **sibling** of the `{#await}` (not inside `{:then}`),
  so the Svelte authoring here is already the parallel shape.

Vue Vapor isn't in this suite (no fixture), but its model is Solid-like
(fine-grained `shallowRef` + immediate tree).

**Key takeaway:** the waterfall is not inherent to any runtime — it's caused
by **where the child sits relative to the await**. Three authoring shapes:

| shape | child location                                       | result                                             |
| ----- | ---------------------------------------------------- | -------------------------------------------------- |
| 1     | inside `then`                                        | serial (React, octane-authored, torpor-as-written) |
| 2     | sibling of the await; only the value text awaits     | parallel (Solid, ripple, Svelte)                   |
| 3     | inside `then`, but compiler hoists the awaited calls | parallel (octane)                                  |

---

## 3. How octane eliminates the waterfall (compiler plan + runtime warm-harvest)

From `node_modules/octane/dist/universal-core.js`:

**Compiler emits a `__warm` plan per component.** For each `Level`, the
compiler emits a tiny pre-run function that executes the component's `use()`
calls (and nested component fetches) **without rendering DOM** — effectively
calling `fetchData(level, version)` to start the fetch.

**Runtime warm-harvest runs those plans on the first suspend.** When `use()`
throws `UniversalSuspense` on a pending promise, `useBatch` drains
`ACTIVE_UNIVERSAL_WARM_PLANS`, running every accumulated warm plan with
`CURRENT_UNIVERSAL_WARM` set. Those plans call `fetchData(...)` for all 10
levels in one synchronous pass. Because `data.js` caches by `level:version`,
each returns the _same_ promise the real render later awaits — all 10 fetches
start in wave 0.

The `__warmCache`/`warmHarvest` machinery then hands the pre-fetched values to
the actual render as each level mounts, so it doesn't re-fetch.

This is the general machinery: attempt/retry tracking, deps-versioned warm
caches, `$$kind` context unwrap, transition keep-old-UI. Torpor doesn't need
most of it.

---

## 4. Why torpor lags, and what it would take

Torpor's `@await` is **runtime-only, per-component, serial**. Each `Level`
renders `@await ($state.data)` → pending branch → on resolve, the `then`
branch mounts the next `Level`, which starts _its_ fetch. There is no compiler
plan — nothing pre-runs the child's `fetchData` before the parent resolves.

### Two honest paths for torpor

**Option A — authoring change (free):** port the fixture to Family B's shape —
`@await` only the `<span class="val">`, keep `<Level>` as a **sibling**. Torpor
already supports this (multi-root / sibling children around an `@await`). This
makes the benchmark land at the parallel floor today. But it changes the
authored shape: a user writing idiomatic nested `@await` (child inside `then`)
still waterfalls.

**Option B — compiler transform (octane-style):** hoist the awaited
promise-creating calls so shape 1 also parallelizes without changing
authoring. This is the genuinely useful feature.

### Feasibility of Option B

The minimal version is a compiler transformation, not a deep runtime feature:

```torp
function Level($props) {
  let $state = $watch({ data: fetchData($props.level, $props.version) });
  @render {
    @await ($state.data) { … } then (data) { <Level level={$props.level+1} …/> }
  }
}
```

The compiler could detect an `@await` over a `$watch`-init expression that
calls a function, and hoist that call into an "eager fetch" pass executed at
mount time for the whole subtree — before the first `@await` renders its
pending branch. Torpor compiles components into functions and knows the tree
statically (as it does for `@for`/`@if`/`@await` → `runControl` regions), so:

1. Recognize `fetchData(level, version)` as a hoistable call.
2. Emit a sibling warm function that just calls the fetch (deduped by the
   module cache).
3. Run it for the root `Level` and, knowing the recursion, for each child.

Why it's tractable: torpor's `@await` is structurally simpler than octane's
`use`/`Suspense` — no attempt/retry, no deps-versioned warm-cache, no
`Suspense` boundary needed. A focused implementation for the "nested `@await`
of a module function call" pattern would be a few hundred lines in
`buildAwaitNode.ts` + a warm runtime helper.

The hard/risky parts:

- **Purity assumption** — hoisting `fetchData(...)` means calling it early.
  Octane does this unconditionally (aggressive). If the awaited expression has
  side effects or isn't cached, eager invocation changes semantics. Torpor
  would need the same caveat, or a narrower trigger (only hoist when the
  awaited value is a plain call into a module-level function — the benchmark
  shape).
- **Recursion detection** — `Level` → `Level`; the compiler must prove the
  recursion is finite/guarded (torpor's `@if (level < LEVELS-1)` guard) to
  pre-run exactly 10 fetches, not loop forever. Octane caps warm depth at 64.
- **Hydration/SSR interplay** — a warm pre-pass runs before the region
  renders; torpor's hydration markers and `$mount` ordering must tolerate it.

### Related suite

`async-composition` (adjacent panels, an imported custom hook with two
independent `use()` reads, and one true dependency `owner` ← `project`) has a
**transition gate** that requires the old dashboard to stay visible while the
new version loads (`retainedOldResourceValues`). Torpor's `@await` tears down
on promise reassignment, so `update` fails that gate. A torpor fixture is
built (`benchmarks/async-composition/torpor-async-composition-bench`) but
can't be added to the manifest until torpor has a keep-old-UI transition
primitive — a separate feature from waterfall elimination.

---

## 5. Open questions

- Is the goal to make the _fixture_ land at the parallel floor (Option A), or
  to make idiomatic nested `@await` fast for users (Option B)?
- Should eager hoisting be unconditional (octane's stance) or gated on
  "awaited expression is a plain module-function call"?
- Does the same warm pre-pass need to work for `update` (re-fetch on version
  change), or only cold `init`?
- How does this interact with `@await` on non-function values (promises from
  `$context`, props, computed getters)?

---

## 6. Newer async models: the real gap

Sections 2–5 frame the choice as Option A (authoring change) vs Option B
(compiler hoist). Both are bounded interventions on torpor's existing
`@await` model. Surveying what Solid 2.0 and Svelte 5.36 actually ship for
async UI reframes the choice: **Option B optimizes a model that is
structurally less capable than what the newer frameworks now ship**, and the
honest upgrade path is a model change, not a transform.

Sources: `solid-2.0/05-async-data.md` on Solid's `next` branch (accessed
2026-08); `docs/svelte/await-expressions` for Svelte 5.36+ (experimental,
opt-in via `experimental.async`, flag removed in Svelte 6).

### 6.1 Real-world gain from nested `@await`

The benchmark's 10-deep recursive `Level` with the child inside `@then`
exists to make the waterfall measurable. Real apps rarely author this shape:

- **Truly dependent fetches** — parent's resolved value selects the child's
  query (fetch project, then fetch its owner) — waterfall _correctly_. No
  transform should parallelize them, and you wouldn't want it to.
- **Independent fetches at different levels** — the far more common case —
  get authored as siblings (panel A beside panel B). That's Family B and is
  already parallel in torpor today.
- The narrow gap where Option B helps (child inside `@then` but the fetch is
  independent of the parent's resolution) is an authoring mistake, not a
  load-bearing pattern.

So Option B's real-world gain is roughly "rescue users who nested when they
didn't need to." Useful in edge cases, small as a framework investment.

### 6.2 Solid 2.0 — async as computation

The headline change: **no `createResource`**. Any computation
(`createMemo`, `createStore(fn)`, derived stores) may return a Promise;
consumers read the accessor normally, and reads that aren't ready follow the
`Loading` boundary. Async is part of the reactive graph, not a parallel
primitive alongside it.

```js
const user = createMemo(() => fetchUser(id()));

<Loading fallback={<Spinner />}>
	<Profile id={id()} />
</Loading>;
```

The pieces that matter for the gaps §4 identifies in torpor:

- **`Loading` is branch-readiness, not "fallback replaces content."** Once a
  branch has produced content, subsequent revalidation keeps the stale
  content visible (transition). The `on` prop opts back into re-showing
  fallback for key-level changes. This is **the keep-old-UI primitive torpor
  doesn't have** — the thing blocking the `async-composition` transition
  gate (§4). Torpor's `@await` tears down on promise reassignment by design.
- **`isPending(fn)` splits first-load from refresh.** The boundary owns
  first-load fallback; `isPending` is for inline "updating…" indicators on
  subsequent refreshes. Critically, a bare `refresh()` is _quiet_ (not
  pending) — re-asking the same question shouldn't ping the user. To make a
  reload read as pending, declare it: `affects(x); refresh(x)`.
  Stale-while-revalidate is the default.
- **Per-primitive SSR policy.** `ssrSource: "server" | "hybrid" | "client"`
  decides whether the client trusts the serialized server value, re-runs the
  compute, or skips server compute entirely. Plus `deferStream: true` holds
  the SSR stream open for a late source, and `transparent: true` makes a
  client-only node hydration-invisible. Torpor's server build
  (`buildServerAwaitNode.ts:27-31`) hard-codes "render pending branch only"
  — Solid makes it the author's call per source.
- **One error path.** Async errors propagate through the graph into `Errored`
  boundaries; no inline `.error` check vs `ErrorBoundary` split (the
  `createResource` legacy torpor would inherit if it grew a `.loading` flag).
- **Helpers for the long tail:** `latest(fn)` peeks at in-flight values
  during transitions; `resolve(fn)` returns a promise for when a reactive
  expression settles; `loadingValue` declares first paint for the case where
  the loading UI _is_ the real UI (feed with placeholder rows, chart from
  default data).

Cost: a larger surface to learn
(`isPending`/`latest`/`loadingValue`/`affects`/`refresh`/`ssrSource`/`deferStream`/`transparent`).
Benefit: every phase of async UI has an explicit primitive.

### 6.3 Svelte 5.36 (experimental) — `await` is just JavaScript

A different bet: drop the special async-control syntax entirely. The JS
`await` keyword now works at the top level of `<script>`, inside
`$derived(...)`, and inside markup:

```svelte
let sum = $derived(await add(a, b));
<p>{a} + {b} = {await add(a, b)}</p>
```

The pieces:

- **Independent awaits auto-parallelize.** Two `{await ...}` expressions in
  the same template run together, even though they look sequential.
  Sequential `await` inside an `async function` still waterfalls (JS
  semantics), and **the compiler warns** (`await_waterfall`) when you author
  one. This is the honest version of Option B: don't transform the
  waterfall, tell the user they wrote one they didn't need.
- **`<svelte:boundary pending={...}>`** has the same first-paint-only
  semantics as Solid's `Loading`. After first resolve, `$effect.pending()`
  drives inline refresh indicators. Solid and Svelte converged on the same
  model independently.
- **Synchronized updates.** When an `await` depends on state, changes to
  that state don't reflect in the UI until the async work completes — no
  inconsistent intermediate renders.
- **`fork(() => { ... })` for intent-based preloading** — neither Solid nor
  torpor has an explicit version. Speculatively start the async work for a
  hover/focus/navigation hint, then `commit()` or `discard()` based on what
  the user does. Genuinely novel.
- **`settled()`** returns a promise that resolves when the current update
  plus downstream async completes. Useful for tests and imperative flows.
- **SSR.** `await render(...)` blocks until all in-template awaits resolve
  (streaming is a planned future addition; boundaries with `pending`
  snippets render the snippet today).
- **Errors bubble to error boundaries** — single path, same as Solid.

Cost: still experimental (effect ordering subtly changes when the flag is
on), SSR streaming not shipped yet. Benefit: least new syntax — authors
write JS `await` and the framework handles the reactive integration.

### 6.4 Where the two converge

Solid and Svelte arrive at the same three ideas from different directions:

1. **Async is a computation, not a control block.** Reading a Promise inside
   a reactive context tracks it; the _boundary_
   (`Loading` / `<svelte:boundary>`) is separate from the _async value_.
2. **First-load pending is a different state from refresh-pending.** The
   boundary owns the first; an inline indicator owns the second.
   Stale-while-revalidate is the default, not an opt-in.
3. **Independent awaits parallelize by default.** Svelte does it
   automatically and warns on accidental serialization; Solid does it
   structurally because sibling computations are independent in the graph.

Torpor's nested `@await` implements none of these.

### 6.5 What this means for torpor

Option B (compiler hoist of nested `@await`) is **a band-aid on a model the
rest of the ecosystem has moved past**. It buys the benchmark number without
addressing any of the structural gaps:

- It still tears down on promise reassignment (fails the `async-composition`
  transition gate).
- It still couples the _async value_ to the _loading UI_ in one control
  block (no first-load vs refresh split).
- It still has no answer for parallel independent awaits outside the narrow
  "child inside `@then` of a module-function call" shape.

The honest upgrade path is a model change, roughly in the Solid direction:

1. **Track promises natively in `$watch` / `$cache`.** Reading a Promise in a
   reactive context registers it; reads that aren't ready throw a
   `NotReady`-style signal caught by an outer boundary.
   `$state = $watch({ data: fetchData(...) })` becomes the whole authoring
   — no `@await` needed at the value site.
2. **Split `@await` into two primitives.** A boundary primitive
   (`@loading`?) owns first-paint fallback and keeps stale content during
   revalidation. A pending primitive (`$pending(fn)`?) exposes in-flight
   state for inline indicators. This is the structural change that closes
   the keep-old-UI gap.
3. **Parallelize independent reads.** Sibling reactive reads of promises
   start together by default; the compiler can warn when an `@await` is
   nested where it didn't need to be (Svelte-style `await_waterfall`).
4. **Optional: `fork()`-style intent-based preloading** for navigation and
   hover hints.

This is a multi-package redesign (compiler + runtime), bigger than Option B
by an order of magnitude — but Option B's complexity is spent preserving a
model Solid and Svelte have already obsoleted. If torpor is going to invest
in async, invest in the model, not in a hoist.

The waterfall benchmark stays honest in the meantime: torpor-as-authored
waterfalls at ~11× because nested `@await` waterfalls by structure, and the
fixture exists to document that fact, not to be optimized around. Section 5's
Option B questions stay on the books as the cost of the band-aid path; §6 is
the argument for not walking it.

---

## 7. Design sketch: the model change

§6 argued the honest upgrade path is a model change in the Solid direction:
track promises natively in `$watch`/`$cache`, split the boundary from the
value, and parallelize independent reads. This section sketches what that
looks like in torpor's idioms — four new primitives plus one piece of hidden
runtime machinery. It is a sketch, not a spec; open questions at the end.

### 7.1 The new surface

| primitive                      | kind                                   | replaces                                                                             |
| ------------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------ |
| `$async(fn)`                   | reactive primitive (in a getter)       | `@await`'s value-binding role; the opt-in that makes a getter suspendable            |
| `@loading { … }`               | control block (boundary)               | the pending/then branches of `@await`                                                |
| `$pending(fn)`                 | reactive query                         | (new — no equivalent today)                                                          |
| `@try { … } catch (err) { … }` | control group (boundary)               | `@await`'s `@catch`; also catches sync errors for the first time                     |
| `@error (err) { … }`           | top-level block (sibling of `@render`) | per-component catch-all; avoids boilerplate `@try` wrapping the whole `@render` body |

Plus, hidden: a **promise indicator** (`didSuspend`) on the `Computed` that
`$async` creates, which the get trap reads through (§7.2).

### 7.2 The promise indicator (hidden machinery)

An earlier draft of this section proposed a per-region
`promiseTracker: Map<Promise, …>` and a compiler-wrapped `t_track_promise`
helper that throws `PromiseNotReady` at every promise read. On closer
reading of the cache machinery, that's more machinery than the model needs
— and it puts an exception on the hot read path. Torpor's cache is already
the natural registration point; promise state is just one more indicator on
it.

#### The cache is already an indicator on the property's signal

`$cache` only works inside a property getter (`$cache.ts:12-14`). When the
proxy's get trap sees a getter, it temporarily redirects
`context.registerComputed` to a closure that stashes the `Computed` into
`data.signals.set(key, computed)` (`proxyGet.ts:50-67`), then runs the
getter. The `Computed` _becomes_ the signal for that property key.
Subsequent reads hit the `COMPUTED_TYPE` branch (`proxyGet.ts:83-99`),
which already interrogates two indicators:

- `recalc` — a source changed; recompute on next read (`checkComputed`).
- `didError` — the computation threw; cache the error and re-throw on read
  (`proxyGet.ts:91-94`, fed by `runComputed.ts:21-25`).

A pending-promise state is a third indicator on the same object:
`didSuspend`. It composes with the existing two exactly the way they
compose with each other.

#### What changes

**`Computed` type** — one new field: `didSuspend: boolean`.

**`runComputed.ts` — unchanged.** The thenable check does _not_ live here;
it lives in `$async` (next subsection). The sync `$cache` hot path pays
nothing.

**`proxyGet.ts` computed-read logic** — add a `didSuspend` branch beside
`didError`. This applies on both read paths: the first read (where the
getter has just run via `$async`/`$cache` and registered the computed) and
subsequent reads (the `COMPUTED_TYPE` branch):

```ts
if (signal.didSuspend) {
	trackSignal(signal); // stay subscribed so resolve re-runs us
	if (context.activeTarget !== null) {
		// propagate the suspend up the cache chain
		context.activeTarget.didSuspend = true;
	}
	if (context.loadingBoundary !== null) {
		// notify the nearest @loading boundary
		context.loadingBoundary.suspended = true;
	}
	return undefined; // placeholder; boundary discards the partial render
}
return signal.value;
```

**No throw.** The suspend is data, not control flow.

#### `$async` — the opt-in primitive

`$async` is the user-facing way to mark a getter as suspendable. It is a
peer of `$cache`: `$cache` for sync cached values, `$async` for async
cached values. A getter uses one or the other, never both.

```torp
function Profile($props) {
	get user() {
		return $async(() => fetchUser($props.id));
	}
}
```

**Signature:** `$async<T>(fn: () => Promise<T>): T`. The thunk runs inside
a `Computed` (so signal reads like `$props.id` are tracked and re-fetch
happens on change), exactly like `$cache<T>(fn: () => T): T`. Must be used
in a getter (same constraint as `$cache`, `$cache.ts:12-14`).

**Implementation** — `$async` creates a `Computed` with `run = fn`,
registers it (via the same `context.registerComputed` path `$cache` uses),
runs it, then does the thenable check + `.then` wiring that §7.2's earlier
draft had placed in `runComputed`:

```ts
function $async<T>(fn: () => Promise<T>): T {
	if (context.registerComputed === null) {
		throw new Error("$async must be used in a getter");
	}
	let computed: Computed = { /* …same shape as $cache… */ didSuspend: false };
	context.registerComputed(computed);
	runComputed(computed); // unchanged — runs fn, tracks deps, caches value
	const value = computed.value;
	if (value !== null && value !== undefined && typeof value.then === "function") {
		const gen = ++computed.generation;
		computed.didSuspend = true;
		value.then(
			(v) => {
				if (computed.generation !== gen) return; // stale resolve
				computed.value = v;
				computed.didSuspend = false;
				propagate(computed);
			},
			(e) => {
				if (computed.generation !== gen) return;
				computed.value = e;
				computed.didError = true;
				computed.didSuspend = false;
				propagate(computed);
			},
		);
	}
	return computed.value;
}
```

Resolve and reject both flow through the existing propagation path
(`propagateSignal`). Reject reuses the existing `didError` cache verbatim —
no separate error machinery for async. The `generation` token handles
stale-resolve on rapid prop changes (§7.8).

**The requirement (enforced).** A getter whose static return type is
`Promise<T>` must use `$async`, not `$cache`. The compiler rejects
promise-returning getters that use `$cache` (or no wrapper). Belt-and-
suspenders runtime guard in dev: if `$cache`'s result is a thenable, throw
_"use `$async` for promise-returning getters."_ This dissolves the
"promises that don't pass through `$cache`" long tail: there is no
bare-promise-read case, because the compiler enforces that every
promise-returning getter declares itself via `$async`. Promises arriving
via `$props` or `$context` are wrapped through an `$async`ing getter in
the receiving component.

There is **no function-style `$async(p)` that takes a bare promise** — the
thunk form is required so that dep tracking and re-fetch work.

#### How suspend propagates without unwinding

The flag-based read above does three things, and together they replace what
a thrown `PromiseNotReady` would have done:

1. **`trackSignal`** keeps the reader subscribed to the suspended computed,
   so when the promise resolves the reader re-runs through the normal
   reactive graph. No special "wake the boundary" path — same propagation
   `recalc` already uses.
2. **Setting `activeTarget.didSuspend`** propagates the suspend _up the
   cache chain_. If
   `$greeting = $cache(() => "Hello, " + $user.name)` reads a suspended
   `$user`, then `$greeting`'s own `Computed` is marked `didSuspend`
   mid-run. `runComputed` checks `didSuspend` on exit and treats the run as
   suspended rather than finalizing `"Hello, undefined"` as a cached value.
   The partial result is never cached.
3. **Setting `loadingBoundary.suspended`** tells the nearest `@loading`
   boundary that its content render touched something pending. The boundary
   discards the partial render and shows fallback (§7.3).

This is the same shape as `$mount` pushing onto `context.mountEffects`
(`$mount.ts`) and `addEvent` pushing onto `context.stashedEvents`
(`addEvent.ts`): registration is a side-effect-of-read (set a flag), drained
through the existing reactive graph on resolve — not an exception walking
the stack, and not a separate accumulator drained at DOM-insertion. The
cache indicator is the registration; the reactive graph is the drain.

#### Why not throw (decision record)

The throw design reuses `runComputed.ts:21-25`'s error cache for free —
zero new indicator, because `PromiseNotReady` rides `didError`. That's a
real win. But it adds a control-flow exception to every reactive read of a
promise, and the indicator model makes the flag-based alternative cheap
enough that the trade-off flips:

- one boolean on `Computed`;
- one branch in `proxyGet` (mirrored on the first-read getter path);
- taint propagation piggybacks on the reactive graph that `trackSignal`
  already builds;
- the boundary detects suspend through a context flag (`loadingBoundary`),
  the same shape as `$mount`/`addEvent` accumulating onto `context`.

The throw costs that motivated the flip: debugger noise (pause-on-exceptions
trips on every suspend), V8 throw overhead per suspend, and fragile
`instanceof PromiseNotReady` checks in user code rendered under `@loading`.
With the flag, suspend and error are cleanly separated — `@try` catches
errors, `@loading` catches suspends, and they never meet at the same throw
site.

### 7.3 `@await` — async boundary (shipped; formerly `@loading`, with `with` in place of `@fallback`)

```torp
function Profile($props) {
	get user() {
		return $async(() => fetchUser($props.id));
	}

	@render {
		@await {
		// user reads set didSuspend on first paint → boundary
		// shows the with branch; on resolve, re-renders with the real value
			<ProfileHeader user={user} />
			<ProfileBody user={user} />
		} with {
			<Skeleton />
		}
	}
}
```

- The boundary renders its content with itself on `context.awaitBoundary`.
  If any read inside sets `boundary.suspended` (§7.2), it discards the
  partial content and renders the `with` branch. Re-render on resolve is
  automatic: the boundary's effect is a dependent of every suspended computed
  it read, so the reactive graph drives the retry.
- When the promise resolves, the boundary re-renders. **On subsequent
  dependency changes** (e.g., `$props.id` changes), the boundary keeps
  showing stale content during revalidation (Solid's branch-readiness rule).
  An opt-in `on` clause re-shows the `with` branch for key-level changes:

  ```torp
  @await on ($props.id) { … }   // re-show with branch when id changes
  ```

- A single boundary commits its content only when no read inside suspends.
  Two independent pending reads inside one boundary stay on the `with` branch
  until both resolve; for incremental fill, use nested or sibling boundaries.
  Sibling `@await` boundaries are independent by construction — which is
  what parallelizes the waterfall fixture without an authoring change:
  sibling levels each own their own boundary, so fetches start together.

This replaces the pending/then branches of the old `@await` control (removed
in Stage C, §7.7). Authoring that needs the resolved value just reads it
(`{$user.name}`); the boundary owns the not-ready state.

### 7.4 `$pending(fn)` — refresh indicator

`$pending` is the query that distinguishes first-load (owned by `@loading`)
from refresh (inline indicator):

```torp
@loading {
	<ProfileHeader user={$user} />
	<button disabled={$pending($user)}>Save</button>
	@if ($pending($user)) { <Spinner small /> }
}
```

Mechanically, `$pending(fn)`:

- Runs `fn` in a tracking context and collects which suspended `Computed`s
  were read.
- Returns `true` iff a read `Computed` has `didSuspend` **and** a tracked
  dependency (signal) changed since the last resolved value. A bare refresh
  (same args, re-fetched) is _quiet_ — `false`. This is Solid's
  stale-while-revalidate default and matches what §4 says torpor lacks for
  the `async-composition` transition gate.

`$pending` is the primitive; `@pending (fn) { … }` as a block is optional
sugar for `@if ($pending(fn)) { … }`. It doesn't buy anything structural
over `@if`, and it can't drive attributes (`disabled={$pending(...)}`), so
ship the function form first and add the block later if ergonomics demand.

**Companion primitive: `$refresh(fn)` (implemented).** The quiet-on-refresh
rule needs a way to trigger a bare refresh — a re-fetch with no dependency
change. `$refresh(fn)` collects the `$async` computeds read by `fn` and
re-runs them, **loud by default** so `$pending` flips `true` and subscribers
are notified at suspend _start_ (the spinner pattern for pull-to-refresh).
`$refresh(fn, { silent: true })` opts into the quiet form (§6.2's bare
`refresh()`): the suspend reads quiet (`suspendQuiet`), `$pending` stays
`false`, and nothing re-runs until resolve — for polling, refetch-on-focus.
See `packages/view/src/watch/$refresh.ts`.

### 7.5 `@try`/`@catch` — error boundary

The current `@catch` in `@await` is narrow: a `.catch()` callback on one
Promise (`buildAwaitNode.ts:105-117`), not a render-time try/catch. The new
model separates errors from any specific promise:

```torp
@try {
	@loading {
		<Profile user={$user} />
	}
} catch (err) {
	<ErrorView error={err} />
}
```

- Catches **sync throws** from rendering the `@try` subtree — component
  errors, getter errors, computed errors (which `proxyGet.ts:91-94` already
  re-throws as cached values). Today these propagate and break the app
  (`runEffect.ts:39-42`); `@try` is the first boundary primitive that
  catches them.
- Catches **async rejections surfaced through promise reads** — the `.then`
  reject handler sets `didError` on the `Computed` (§7.2), and reads
  re-throw via the existing `proxyGet.ts:91-94` path. `@try` catches that
  re-throw; no async-specific machinery.
- One error path. The dual inline-`.error` vs `ErrorBoundary` split that
  Solid 2.0 explicitly rejects (§6.2) is avoided by construction.
- **Suspend is not an error.** `didSuspend` is handled entirely by
  `@await` (§7.3) and never reaches `@try`. This is a benefit of the
  flag-based design: with a throw-based suspend, `@try` would need to
  distinguish `PromiseNotReady` from real errors by `instanceof` on every
  catch.

Parser-wise, this is the same shape as `@if`/`@else`: a control group with
branches. The walk in `parseControl.ts` attaches `@catch` to the most recent
`@try group`.

**Naming collision with `@catch` (resolved).** The old `@await` control's
`@catch` branch is gone (removed in Stage C, §7.7), so `@catch` attaches only
to the nearest `@try group` — no collision.

**No `@finally`:** no clear declarative use case; Solid and Svelte don't
ship one either.

### 7.6 Component-level `@error` — top-level block, sibling of `@render`

`@try`/`@catch` works inside `@render` for targeted boundaries around
specific subtrees. But "this component should not crash the app" is a
per-component concern, and without a top-level form, every resilient
component ends up wrapping its entire `@render` body in
`@try { … } catch (err) { … }` — pure boilerplate. A top-level `@error`
block, as a sibling of `@render`, provides the catch-all without the
wrapping noise:

```torp
function Profile($props) {
	get user() {
		return $async(() => fetchUser($props.id));
	}

	@render {
		<ProfileHeader user={user} />
		<ProfileBody user={user} />
	}

	@error (err) {
		<ErrorView error={err} />
	}
}
```

Semantics:

- **Implicit `@try` around `@render`.** Conceptually, every component's
  `@render` body is wrapped in an implicit `@try`. The `@error` block
  provides the catch branch. If `@error` is absent, the implicit `@try` has
  no catch and errors bubble to the parent component (matching today's
  behavior — sync throws propagate and break the app, `runEffect.ts:39-42`).
- **Scope: render-time errors only.** `@error` catches errors thrown while
  rendering (or re-rendering on reactive changes) the `@render` output: sync
  throws, async rejections surfaced through promise reads (§7.2), and
  errors that bubble up from child components. It does _not_ catch errors
  from the component's setup phase (the `let $state = …` and `$run(…)`
  calls before `@render`) — those prevent the component from mounting, so
  the `@error` block (which lives inside the component) can't render either.
  Setup errors propagate to the parent's `@error`.
- **Effect errors.** `$run` effects that throw on re-run (after the initial
  render) are caught by the nearest `@error`/`@try` in scope, since they
  re-render through the same propagation path. This matches Solid's `error`
  option on `createEffect`.
- **Bubbling.** If a child component throws and has no `@error`, the error
  bubbles up the rendered tree to the nearest `@try` or component-level
  `@error`. Same propagation as React error boundaries, Solid's `<Errored>`,
  and Svelte's `<svelte:boundary>`.
- **No default at the root.** If no ancestor provides an `@error` or
  `@try`, the error propagates out of the root and breaks the app (same as
  today). Production apps should add an `@error` at the root component —
  explicit, not magic.

**Naming:** `@error` rather than `@catch` because there's no preceding
`@try` in the top-level syntax. Matches Solid's `<Errored>` and React's
"error boundary" terminology.

**Symmetry with `@loading`?** In principle, a top-level
`@loading { fallback }` as a sibling of `@render` would handle the "whole
component is async" case the same way. But loading fallbacks are usually
layout-specific (different positions in the tree need different fallbacks),
while error fallbacks are usually uniform ("show an error in place of this
component"). Ship `@error` first; revisit top-level `@loading` if
boilerplate complaints emerge.

### 7.7 Migration path

Three-stage rollout, since the model change touches both compiler and
runtime:

1. **Stage A — error boundaries first (independent of async).** Ship
   `@try`/`@catch` and the top-level `@error` block together. Both are
   independently useful today (no boundary primitive exists, sync throws
   break apps), low-risk (no promise machinery), and exercise the parser
   changes for new control groups and a new top-level block without touching
   reactivity. Land this even if the rest is deferred.
2. **Stage B — `$async` + promise indicator + `@loading` + `$pending`.**
   Ship together; they're inseparable. Runtime changes: `didSuspend` (and a
   `generation` counter) on `Computed`; the `$async` primitive (new —
   creates the `Computed`, runs it, does the thenable check + `.then`
   wiring); the `didSuspend` branch in `proxyGet` (mirrored on both read
   paths); `context.awaitBoundary` for boundary notification. `runComputed`
   is unchanged. Compiler changes: `$async` recognition + the promise-getter
   requirement (§7.2); `@await`/`with`/`$pending` codegen.
3. **Stage C — remove `@await` (done).** The old `@await (p) {…} then (v)
   {…} catch (e) {…}` control was removed and the boundary renamed from
   `@loading {…} @fallback {…}` to `@await {…} with {…}` (the parser errors
   on the old `@await (expr)` form pointing at the migration:
   `get x() { return $async(() => p) }` + `@await {…x…}`). `$refresh` and the
   `with` branch shipped alongside.

### 7.8 Open questions

- **Promise identity and re-fetch.** `$async`'s `Computed` keys on the
  promise its thunk returned. If the thunk returns a fresh Promise every
  run (`() => fetch(url)` with no module cache), each re-run re-suspends. Is
  that the right behavior (the boundary re-shows fallback — arguably
  correct), or do we need a per-source key?
- **Rapid prop changes.** `$async`'s `generation` counter handles stale-
  resolve (a resolve from a previous run is ignored), but the boundary also
  needs a token to ignore stale re-renders — same shape as
  `buildAwaitNode.ts:71`'s await token.
- **SSR.** The server build (`buildServerAwaitNode.ts`) currently
  renders the `with` branch only. For `@await`, what does the server
  render? Options: (a) render the `with` branch and stream replacements as
  promises resolve (Solid's `deferStream`); (b) `await` the boundary's
  promises and render resolved content (Svelte's `await render(...)` today);
  (c) render the `with` branch only, no streaming. Solid makes this
  per-primitive via `ssrSource`; torpor would have to pick a default.
- **`$pending` first-load semantics.** The "quiet on bare refresh" rule
  requires the indicator to know whether a read is the first for a given
  `Computed` or a re-read after a dependency change. How is "first"
  defined — per computed? per signal? What about a read inside an `@if`
  that flips from false to true (a "new" first load)?
- **`$context` and cross-component promises.** Dissolved under the
  indicator model: a `Computed` carries its own `didSuspend`, and
  `Computed`s already participate in the reactive graph across `$context`
  and component boundaries — no per-region/per-tree scope decision to make.
  Promises passed _in_ via `$context` or `$props` are wrapped through an
  `$async`ing getter in the receiving component (§7.2).
- **Taint propagation cost.** Every read of a suspended `Computed` flips
  `didSuspend` on the active reader, up the cache chain. For deep cache
  chains this is O(depth) per read. Probably fine (chains are shallow in
  practice), but worth measuring on the `async-composition` fixture.
- **Recursion under `@loading`.** A `<Level>` rendered inside an `@loading`
  boundary that reads its own `$state.data` (the waterfall fixture's shape)
  — does each level need its own boundary, or does one outer boundary own
  the whole tree? Solid catches everything in its subtree; Svelte's nested
  `<svelte:boundary>` allows either. Under the flag model a single boundary
  commits only when no read suspends, so a single outer boundary over the
  whole recursion would wait for the deepest level before committing
  anything — the fixture needs sibling per-level boundaries to parallelize.
  That matches the authoring shape in §7.3 anyway. It also affects what
  "stale during revalidation" means for a recursive child whose own data
  hasn't resolved yet.
- **Interaction with hydration markers.** Server renders fallback (today's
  shape) or streamed content (option (a) above); client hydrates against
  whichever it gets. The hydration comments emitted by
  `buildServerAwaitNode.ts:19,34,37` assume a single branch — multiple
  resolved-promise states need a richer marker scheme.
