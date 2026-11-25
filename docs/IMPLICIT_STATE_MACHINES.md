# Implicit state machines in torpor

An inventory of every place in this codebase where an entity moves through
discrete states with guarded transitions — without a formal FSM construct.
This document was produced by a systematic sweep of all packages (November 2026).

**Headline finding:** there is no formal FSM construct anywhere — no state enums
with transition functions, no XState-style library. Every machine below is
expressed as boolean latches, generation counters, depth counters, promise maps,
sentinel strings, or `??=` memoization. There are **~100 distinct machines**;
the majors are described in [Tier 1](#tier-1--architecturally-load-bearing-machines)
and everything else in [Tier 2](#tier-2--per-subsystem-inventory).

---

## Tier 1 — architecturally load-bearing machines

These are the machines worth understanding first. They sit on hot paths, span
multiple files, or have the most states/transitions.

### 1. Signal dirty graph (pull/push propagation)

- **Where:** `packages/view/src/watch/propagateSignal.ts:24-55`,
  `watch/checkSources.ts:14-63`, `watch/checkComputed.ts:12-46`,
  `watch/deactivateSources.ts:8-19`, `watch/trackSignal.ts:10-53`,
  `watch/clearSources.ts:8-39`;
  state carriers in `types/Subscription.ts:40-51`, `types/Computed.ts:44-55`
- **States:** per Computed/Effect target: `CLEAN` (`recalc=false`) →
  `CHECK/DIRTY` (`recalc=true`) → `RUNNING` → `CLEAN`.
  Per Subscription edge: `ACTIVE` (`active=true`) → `INACTIVE-RECALC`
  (`active=false, recalc=true`) → re-`ACTIVE` (reused on re-run, `recalc` reset)
  or `REMOVED` (unlinked from both lists by `clearSources`).
- **Enforcement:** push phase (`propagateFromSignal`) marks
  `targetSub.active = false; targetSub.recalc = true`. Pull phase
  (`checkSources`) bails early on a dirty SIGNAL source and recursively pulls
  dirty COMPUTED sources via `checkComputed`. `checkComputed` clears
  `computed.recalc = false` and, when the value didn't change, force-reactivates
  all target subs (the "subtree is clean" transition,
  `checkComputed.ts:30-43`). `clearSources` removes only `!active` subs —
  and **all** subs when `target.didError`. Dev-only invariant: the signal
  update chain's head/tail pointers must be null together (`propagateSignal`
  append, `devAssert`).

```ts
// propagateSignal.ts:26-27
targetSub.active = false;
targetSub.recalc = true;

// checkSources.ts:27-35 — dirty-signal fast bail vs computed pull
if (sourceSub.recalc) {
	if (sourceSub.source.type === SIGNAL_TYPE) {
		return true;
	} else {
		if (sourceSub.source.recalc) {
			haveComputed = true;
		} else {
			return true;
		}
	}
}

// checkComputed.ts:40-42 — unchanged value → targets go clean
targetSub.active = true;
targetSub.recalc = false;
```

### 2. Batch flush queue

- **Where:** `watch/batchStart.ts:3-5`, `watch/batchEnd.ts:4-17`,
  `watch/$batch.ts:11-22`, `watch/propagateSignal.ts:40-43, 91-108`,
  `watch/triggerEffects.ts:30-107`, `watch/proxySet.ts:19-21`,
  `render/context.ts:12-18`, `types/Effect.ts:44-48`
- **States:** batch `IDLE` (`context.batch === 0`) ⇄ `COLLECTING`
  (`batch > 0`; nestable — `batchEnd` only flushes when the counter hits 0).
  Per-Effect: `UNQUEUED` (`queued=false`) → `QUEUED` (`queued=true`, appended
  to `context.effectsToRun`) → `RUNNING` (`queued=false` set _before_ running
  so in-run writes can re-queue) → `UNQUEUED`.
- **Enforcement:** `queued`-flag dedupe — deliberately flag-based rather than
  link-based (comment at `propagateSignal.ts:32-39` explains an oscillation bug
  this prevents). Cycle detector counts `batchOperation` and throws at >100
  (`proxySet.ts:19-21`). Post-flush cleanup defensively resets every `queued`
  (`triggerEffects.ts:84-89`). Dev-only invariant: `batchEnd` throws when
  called without a matching `batchStart` (`devAssert`, dev builds only).

```ts
// propagateSignal.ts:40-43
if (!target.queued) {
	target.queued = true;
	context.effectsToRun.push(target);
}

// triggerEffects.ts:50-53
// Mark as not-queued BEFORE running, so that a signal write made
// during this run ... can re-queue it if a source changed again
effect.queued = false;

// batchEnd.ts:5-8
if (context.batch > 1) {
	context.batch--;
	return;
}
```

### 3. `$async` computed lifecycle

- **Where:** `watch/$async.ts:46-161`, `types/Computed.ts:16-124`,
  `types/AsyncSettle.ts`, `watch/$cache.ts:44-54`, `watch/$refresh.ts:65-132`,
  `watch/$pending.ts:25-35`, `watch/proxyGet.ts:35-86`,
  `watch/propagateSignal.ts:18`
- **States:** `INITIAL` (created, `settle === undefined`) → `PENDING/SUSPENDED`
  (`didSuspend=true`, `generation` captured) → `RESOLVED`
  (`settle = { ok: true, value: v }`) | `ERRORED`
  (`settle = { ok: false, error: e }`, `didError=true`). Plus:
  - **quiet refresh** — `suspendQuiet = settle !== undefined && !recalc`;
    readers get the retained `settle.value` instead of suspending
  - **hydration-seeded** — a server value wins the generation race
    (`$async.ts:150-158`)
- **Enforcement:** generation counter — every run increments
  `computed.generation`; settle handlers drop stale resolves via
  `if (computed.generation !== gen) return`. The last settle is stored as a
  single discriminated union (`settle: AsyncSettle | undefined` — the same
  shape as the SSR side's `ServerPromiseEntry.result`) rather than correlated
  booleans, so "resolved but never settled" and "errored with a retained
  stale value" are unrepresentable. `$refresh` distinguishes "initialization
  IS the refresh" via `context.refreshInitialized`. `$cache` throws if a
  getter returns a Promise (`$cache.ts:48-54`). Dev-only invariant: a
  generation-guarded settle throws if `didSuspend` is false (the settle
  machine's bookkeeping is broken).

```ts
// $async.ts:108-121
computed.suspendQuiet = computed.settle !== undefined && !computed.recalc;
(value as Promise<T>).then((v) => {
	if (computed.generation !== gen) return; // stale-run drop
	computed.value = v;
	computed.didSuspend = false;
	computed.settle = { ok: true, value: v };
```

### 4. Client `@await` boundary (`runAwait`)

- **Where:** `render/runAwait.ts:59-235`, `render/AwaitSuspend.ts:11-16`,
  `types/AwaitBoundary.ts:10-34`, `watch/proxyGet.ts:42-84`
- **States:** branch `index ∈ {-1 = initial, 0 = content, 1 = with/fallback}`,
  gated by three flags: `boundary.suspended` (mailbox, reset per attempt),
  `hasContent` (true once content rendered without suspending — enables
  stale-while-revalidate), and `first` (first run uses the speculative render
  path; subsequent runs re-derive `suspended` from the `boundary.pending` set).
- **Enforcement:** first run renders content speculatively; a first-load
  pending read throws the `AwaitSuspend` sentinel
  (`proxyGet.ts:81-83`), caught at `runAwait.ts:158-162`, partial render
  discarded, with-branch shown. Branch switch only when
  `targetIndex !== index`. With `hasContent`, a refresh suspend keeps stale
  content. `region.generation` guard kills stale effects.

```ts
// runAwait.ts:71-73
let index = -1; // -1 = initial, 0 = content, 1 = with
let first = true;
let hasContent = false; // true once content has rendered without suspending

// runAwait.ts:203-212
const targetIndex = suspended ? 1 : 0;
if (targetIndex !== index) {
	if (targetIndex === 0) {
		attemptContent();
	} else if (!hasContent) {
		/* show with-branch ... */
	}
}
```

### 5. Region lifecycle

- **Where:** `types/Region.ts:4-50`, `render/newRegion.ts:3-14`,
  `render/pushRegion.ts:5-37`, `render/popRegion.ts:5-9`,
  `render/clearRegion.ts:4-46, 121-187`, `render/runControl.ts:41-53`,
  `render/runList.ts:41`, `render/runControlBranch.ts:6-10`
- **States:** `CREATED` (`depth = -1`, nulls everywhere) → `LIVE/ATTACHED`
  (linked into the doubly-linked region chain, `depth = parent+1`) →
  `TOMBSTONE` (`depth = -2`, set for children of a cleared region,
  `clearRegion.ts:23`) → `RELEASED` (`generation = -1`, nodes/pointers nulled,
  effects cleaned + detached, `clearRegion.ts:121-187`). Also a one-shot
  `recreate` flag.
- **Enforcement:** stale effects check `region.generation !== gen` and skip
  (`runControl.ts:47-49`, `runTry.ts:84-86`, `runAwait.ts:94`). Tombstoned
  lists check `region.depth === -2` → set `recreate = true` and skip
  (`runList.ts:38-41`); `runControlBranch` consumes `recreate` exactly once.
  `releaseRegion` unlinks every subscription so cleared effects never re-run.

```ts
// clearRegion.ts:121-131
function releaseRegion(region: Region) {
	(region as any).generation = -1;
	region.startNode = null;
	// ...

// runControl.ts:47-49, 51-53
if ((region as any).generation !== gen) { return; }
if (region.depth === -2) { (region as any).recreate = true; }
```

### 6. Keyed-list reconciliation (`runListItems`)

- **Where:** `render/runListItems.ts:107-385`, `render/runList.ts:33-67`,
  `render/getSequence.ts:13-56`, `types/ListItem.ts`
- **States:** whole-pass phase machine: `1` head/tail+rotation fast path →
  `2` old-exhausted → mount tail → `3` new-exhausted → clear → `4` messy middle
  (4a keymap / 4b no-overlap replace-all / 4c reuse+clear / 4d LIS /
  4e move/mount) → `5` chain relink. Per-item outcomes: `REUSED-IN-PLACE`,
  `MOVED`, `MOUNTED`, `CLEARED`.
- **Enforcement:** key equality guards each transition;
  `newIndexToOld[i] = 0` marks a mount slot; LIS membership (`i !== seq[j]`)
  decides move vs stay; the O(1) tail fixup is gated by
  `!chainNeedsRelink`.

```ts
// runListItems.ts:156, 286-293
let chainNeedsRelink = false;
// ...
if (newIndexToOld[i] === 0) {           // no matching old item → mount
	newItems[newIdx] = mountSpec(...); chainNeedsRelink = true;
} else if (j < 0 || i !== seq[j]) {     // not in LIS → move
	moveRegion(parent, newItems[newIdx]!, before); chainNeedsRelink = true;
```

### 7. Server `@await` boundary (collect/render)

- **Where:** `packages/view/src/ssr/serverAwaitState.ts:22-79, 108-147`,
  `ssr/runServerAwait.ts:55-205`, `ssr/$serverAsync.ts:52-115`,
  `ssr/serverSentinels.ts:27-74`
- **States:** `collect` (speculative render; output discarded; getters record
  promises) → (short-circuit) `empty-collect` (`promises.length === 0` → ship
  `with` branch immediately) → `settling` (the `Promise.race` window vs
  `SERVER_ASYNC_TIMEOUT`) → `render` (entered only if the race returned true;
  counters reset so both passes derive identical key sequences) →
  `shipped-resolved` (terminal) | `degraded` (one-way latch; ships `with`
  branch). Per-read-site dispatch inside `$serverAsync`:
  `no-state | root-state | boundary-collect | boundary-render`.
- **Enforcement:** `phase` flips collect→render exactly once (no back-edge;
  enforced structurally). `ServerAwaitMisaligned` throws mark unreachable
  transitions: a render-pass getter read that wasn't in the collect records
  (`$serverAsync.ts:98-100`), or a `result === undefined` read — explicitly
  documented as unreachable ("only possible when the boundary already blew its
  timeout"). Degrades on timeout, on any render throw, on
  `state.clientReads > 0` (a client-fetch read during render).

```ts
// runServerAwait.ts:145-160
let degraded = settled === false;
let content: { body: string; head: string } | undefined;
if (!degraded) {
	state.phase = "render";
	state.renderEntries.length = 0;
	// ...
	try {
		content = await withServerAwait(state, renderContent);
		if (state.clientReads > 0) {
			degraded = true;
		}
	} catch {
		degraded = true;
	}
}
```

### 8. Navigation pipeline (client router)

- **Where:** `packages/build/src/nav/navigate.ts`, `nav/loadData.ts`
- **States:** idle → loading (in flight, cancellable) → commit (synchronous) →
  outcome (`reused | withHydration | remounted`; superseded → dropped; failure
  → error-route substitution or rollback snapshot). Per-stack-layout slot:
  `new → rendered → reuse` (guarded by the liveness predicate
  `stackLayout.slotRegion?.startNode?.parentNode != null`).
- **Enforcement:** the newest navigation wins. Each `navigate` bumps
  `latestNavigation` and aborts the previous navigation's `AbortController`,
  so a slow or hung `/~server` request can't delay the one that follows.
  Loading is concurrent; commits are not: after every `await`, the navigation
  checks `id !== latestNavigation || signal.aborted` and returns the
  `superseded` outcome before touching `$page`, `client.layoutStack` or the
  DOM. The layout stack is assigned inside the synchronous render closure, so
  an in-flight navigation can't disturb the stack the winner is reading.
  `navigateNow` restores `$page.url/status/error` on throw (error-rollback,
  only while still current). A region can die mid-navigation — the render
  closure re-checks and falls back to `window.location.reload()`.

```ts
// navigate.ts
let latestNavigation = 0;
let activeController: AbortController | undefined;

const id = ++latestNavigation;
activeController?.abort(); // supersede the previous request
const controller = new AbortController();
activeController = controller;
```

Callers treat `{ type: "superseded" }` as "do nothing": the click handler
doesn't push a history entry or fall back to a document load, and `popstate`
leaves the page and scroll to the newer navigation.

### 9. Middleware/hook enter–exit

- **Where:** the shared implementation in
  `packages/build/src/server/runHooks.ts` (`runHooks`), called from:
  `packages/build/src/server/Server.ts:35-90` (the low-level per-Server
  primitive, `event: ev` so exits can replace the response);
  `site/serverHandlers.ts` — route middleware in `handle`, global middleware
  in `load` (with an `onError` that renders the error page before exits run),
  `loadPageData` (middleware + server-hook phases), and `loadData` /
  `runAction` / `loadView` (server-hook flavor, no event).
- **States:** entering (in order, tracked by an `entered` counter) →
  response-set (short-circuit stops the loop) → exiting (reverse, only the
  entered ones).
- **Enforcement:** one shared `runHooks` implementation — enter hooks run in
  phase order until one returns a Response; the handler runs only if no enter
  responded; exit hooks run in reverse entry order (across phases) even when
  the handler or an enter hook threw. Errors are captured (and set on
  `ev.error`) rather than thrown, so `onError` can render an error response
  before exits run — callers rethrow `error` when the result carries no
  response. With `event` (the middleware flavor), `ev.response` is kept in
  sync and an exit's returned Response replaces the response, per the
  `MiddlewareFunction` contract. `ServerEvent.addHeaders()` throws
  `"Response not created yet"` when the response hasn't been set yet.

### 10. Parser component boundary

- **Where:** `packages/view/src/compile/parse/parseCode.ts:36-117`;
  context in `compile/parse/ParseStatus.ts:8-33`
- **States:** "top-level script" ⇄ "inside component body" ⇄ "inside markup
  section". State variables are `ParseStatus.level` (brace depth) and
  `ParseStatus.braces: boolean[]` — a parallel stack recording the _kind_ of
  each open brace (true = component function brace, false = plain script
  brace).
- **Enforcement:** `}` pops `braces`; the guard
  `status.level === 0 && fromComponent` decides whether the component ends —
  a `}` from an interface/type must _not_ end the component. Failed
  `function`/`const`/`export default` matches rewind `status.i`.

```ts
} else if (status.source[status.i] === "}") {
	status.level -= 1;
	const fromComponent = status.braces.pop();
	if (status.level === 0 && fromComponent) {
		parseComponentEnd(status);
	} else if (status.level < 0) { addError(...); status.level = 0; }
```

### 11. Codegen phase machine (chunk sentinels)

- **Where:** `compile/build/client/buildCode.ts:170-260`; server twin
  `compile/build/server/buildServerCode.ts:123-293`; sentinel creation at
  `compile/parse/parseCode.ts:235-239, 296-308, 329-336, 364-368, 401-408,
  438-445, 507-515`
- **States:** the parser injects sentinel strings into `template.script` —
  `/* @params */`, `) /* @return_type */ {`, `/* @start */`, `/* @render */`,
  `/* @error */`, `/* @head */`, `/* @style */`, `/* @end */`. The codegen
  loop is a linear FSM over these phases; `/* @end */` is the
  component-advance transition (`currentIndex += 1`). The server variant adds
  an `asyncChunks` set that rewrites declarations to `async function`, and
  creates a fresh `BuildServerStatus` per section.
- **Enforcement:** exact string matching on sentinel chunks; the parser and
  codegen are coupled by these strings (e.g. `tryParseRequirement` patches into
  the script stream using the exact sentinel `"/* @start */"`).

### 12. Shared JS literal scanner

- **Where:** `packages/view/src/compile/utils/codeScanner.ts:40-256`
  (`skipInRange`, `skipTemplateString`, `endOfInterpolation`,
  `isRegexPosition`, `skipRegexLiteral`)
- **States:** `'`/`"` string, backtick template (with `${` → recursive
  interpolation sub-machine), `//` line comment, `/*` block comment, regex
  (guarded by `isRegexPosition`), escape state, regex char-class state
  (`inClass`).
- **Enforcement:** `isRegexPosition` (169-221) is itself a mini state machine:
  skip whitespace → step back over block comments → classify previous
  significant char (`) ] } " ' \` → division; identifier → keyword-set guard;
  `+`/`-` postfix guard; else regex). `skipRegexLiteral` keeps an explicit
  `inClass` boolean so `/` inside `[]` doesn't terminate. This scanner is
  consumed by nearly every other scanner in the compiler.

### 13. Popout open/closed (biggest UI machine)

- **Where:** `packages/ui/src/utils/popoutContent.ts:40-178`
  (`createPopoutContent`); consumers: `Popover`, `Modal`, `Drawer`, `Menu`,
  `MenuBar`, `SubmenuPopout`, `Contextual`, `DatePicker`, `ComboBox`,
  `SelectBox`, `CommandPalette` — **~15 components**
- **States:** `hidden → shown` (local `shown`), plus guard flags
  `closeOnClick` and `hadFocus`.
- **Enforcement:** closing on outside click requires a _prior_ `mousedown`
  (`closeOnClick`, HACK comment at 36-38) so the opening click can't
  immediately close. Escape close optionally guarded by
  `escapeOnlyWhenFocused`. Repositioning while open via resize/scroll/
  ResizeObserver. Refocus-anchor-on-hide arms the one-shot
  `suppressFocusOpen()` guard (`utils/suppressFocusOpen.ts:11-31`) so
  focus-to-open triggers don't re-open. Owner components hold
  `$state.visible` (two-way bound via `$bind`) and dispatch
  `onopen`/`onclose`; a `handleButton("confirm"|"cancel", value)` transition
  sets `result` then `visible=false`.

### 14. Frame bridge RPC

- **Where:** `packages/embed/src/frame/frameBridgeScript.ts:36-82`; contract
  in `frame/protocol.ts:20-35`; host side in
  `frame/listenEmbedFrame.ts:56-88`
- **States:** per call (keyed by numeric id): `absent → pending → resolved |
  rejected`. **There is no timeout state** — a call whose result never arrives
  stays pending forever.
- **Enforcement:** send assigns `id = ++callId; calls[id] = { resolve, reject
  }`. Response intake guards: `event.source !== parent` → ignore; channel
  mismatch → ignore (by design); unknown/expired/duplicate call id → dropped
  (`if (!pending) return`). Terminal transition deletes the entry then
  resolves/rejects.

```js
if (data.kind === "invoke-result" || data.kind === "invoke-error") {
	var pending = calls[data.call];
	if (!pending) return;
	delete calls[data.call];
	if (data.kind === "invoke-error") pending.reject(new Error(data.message));
	else pending.resolve(data.value);
}
```

---

## Tier 2 — per-subsystem inventory

### Reactive runtime — `packages/view/src/watch`, `render`

| Machine                                      | States                                                                                                                                                                                                                                                                                      | Where                                                                                                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Error-boundary routing** (`@try`/`@catch`) | `CLEAN` → `ERROR-ROUTED` (`hasError`, `heldSignals` captured) → `CATCH SHOWN` → `RECOVERY` → `CLEAN`; unhandled errors take a side state and rethrow after the flush                                                                                                                        | `watch/routeEffectError.ts:36-86`, `render/runTry.ts:66-157`, `watch/triggerEffects.ts:104-106`                                                |
| **Per-Effect run/error**                     | `IDLE → RUNNING → OK \| ERRORED`; per-run flags reset at entry; an errored effect detaches _all_ sources (`clearSources` treats `didError` as detach-everything) and snapshots `errorSources` for the boundary; self-heal re-subscribes `suspendSources` when no boundary handled the error | `watch/runEffect.ts:10-67`, `watch/runCleanups.ts:8-33`, `watch/clearSources.ts:15`, `watch/triggerEffects.ts:16-25`                           |
| **Hydration branch-mismatch**                | `NO-SERVER-BRANCH` → `STASHED` (server index + anchor) → `ADOPTED` \| `RECREATED` (server markup cleared, hydration disabled for re-render); `takeBranchIndex` is take-once                                                                                                                 | `render/runControl.ts:29-35, 78-84`, `render/runControlBranch.ts:5-64`, `render/branchIndex.ts:13-30`                                          |
| **Hydration cursor**                         | global mode `MOUNTING` (`hydrationNode === null`) ⇄ `HYDRATING` (cursor walks/adopts server DOM); `nodeAnchor` runs a nested `level` counter over `[`/`]` markers; `@try` snapshots/restores the cursor (rewind must restore even `null`)                                                   | `render/context.ts:37`, `render/nodeAnchor.ts:28-171`, `render/saveHydration.ts`, `render/restoreHydration.ts`, `render/runListItems.ts:73-81` |
| **Read-path modes**                          | `TRACKING` ⇄ `PEEK` (`suspendPeek` — track but never notify; loud hits recorded) ⇄ `COLLECTING` (`refreshSignals` — reads appended for bare refresh); save/restore everywhere                                                                                                               | `render/context.ts:102-119`, `watch/$peek.ts:11-20`, `watch/$refresh.ts:66-85`, `watch/$pending.ts:25-35`, `watch/proxyGet.ts:42-47, 154-169`  |
| **`$onmount` flush**                         | `STASHED` (queue) → `FLUSHED` (deferred while hydrating) → `DEAD` (once-only; excluded from reconciler force-reruns)                                                                                                                                                                        | `watch/$onmount.ts:25-30`, `watch/flushMountEffects.ts:23-56`, `render/runMountSideEffects.ts:24-35`, `render/rerunRegionEffects.ts:40-50`     |
| **`$bind` first-write suppression**          | `FIRST` (backward effect runs but skips the write) → `SYNCING`; same-value writes are no-ops at the proxy layer, which stops the two-way loop                                                                                                                                               | `watch/$bind.ts:50-63`                                                                                                                         |
| **Region animation gate**                    | `NO-ANIMATIONS` vs `ANIMATING` (`animations` Set); region clear splits into immediate vs deferred-until-`Promise.all(finished)`                                                                                                                                                             | `render/animate.ts:202-210`, `render/clearRegion.ts:12-45`                                                                                     |
| **Graph node type tags**                     | `SIGNAL_TYPE=0 / COMPUTED_TYPE=1 / EFFECT_TYPE=2` — decides queue-vs-mark in propagation and bail-vs-pull in checking                                                                                                                                                                       | `types/constants.ts:4-12`; consumed in `proxyGet.ts`, `propagateSignal.ts`, `checkSources.ts`, `flushMountEffects.ts`                          |
| **Cycle guards**                             | re-entrant computed read → throw (`signal.running`); `batchOperation > 100` → `"Cycle detected"`                                                                                                                                                                                            | `watch/proxyGet.ts:225`, `watch/proxySet.ts:19-21`                                                                                             |
| **SSR-compiled component guards**            | mount/hydrate throw on server-compiled components; mount requires EMPTY parent                                                                                                                                                                                                              | `render/mount.ts:28-38`, `render/hydrate.ts:22-26`                                                                                             |

### SSR & streaming — `packages/view/src/ssr`, `stream`

| Machine                          | States                                                                                                                                                                                                                                   | Where                                                                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Per-promise settlement latch** | `result === undefined` (pending) → `{ok: true, value}` \| `{ok: false, error}` (terminal); written exactly once; rejections pre-consumed "so a boundary that degrades can never surface as an unhandled rejection"                       | `ssr/serverAwaitState.ts:85-94`, `ssr/$serverAsync.ts:83-90`                                                                       |
| **Sentinel substitution**        | per sentinel string: `emitted` → `registered` (in `state.sentinels` or `state.children`) → `substituted` (await + string-replace) \| `lost` (leftover sentinel → throw: "a bug, not a degradation path")                                 | `ssr/serverSentinels.ts:27-74`, `ssr/runServerAwait.ts:67-83`                                                                      |
| **Async-context pointers**       | `null` ⇄ `set` for `currentServerAwait` and `currentServerReadSite`; restore-in-`finally`; sound because read only synchronously                                                                                                         | `ssr/serverAwaitState.ts:108-131`, `ssr/$serverWatch.ts:46-52`                                                                     |
| **Nested boundary alignment**    | during a parent's render pass, a nested boundary must find its cached child (`children.get(childKey(...))`); a miss throws `ServerAwaitMisaligned` and degrades the parent                                                               | `ssr/runServerAwait.ts:55-65`, `serverAwaitState.ts:154-158`                                                                       |
| **Hydration handoff payload**    | resolved boundary ships `<![>body<!]><!>` + `<!--t-await:[JSON]>`; array order is exactly the render pass's first-read order; `-->` escaped; degraded boundaries ship empty markers; order alignment enforced only by construction       | `ssr/runServerAwait.ts:190-205`, consumed client-side in `render/runAwait.ts:17-20`                                                |
| **Stream subscription**          | `unsubscribed → subscribed → cleanup → (re)subscribed`, driven by reactive deps; `fromElement` guard-throws on unassigned refs; `fromServer`/`fromWebSocket` deliberately delegate connection/reconnection state to the platform objects | `stream/fromServer.ts:17-25`, `stream/fromWebSocket.ts:17-25`, `stream/fromElement.ts:26-43`, SSR stub `ssr/$serverStream.ts:8-12` |
| **Environment guard**            | client runtime symbols (`mount`, `hydrate`, ...) are import-safe but call-always-throws on the server: `type Unavailable = (...args) => never`                                                                                           | `ssr/unavailable.ts:12-54`                                                                                                         |
| **Slot shape guard**             | if a fill's first element would auto-close the slot's ancestor, throw at SSR instead of shipping markup hydration can't adopt                                                                                                            | `ssr/slotGuard.ts:15-24`                                                                                                           |

### Compiler parsers — `packages/view/src/compile/parse`

| Machine                                    | States                                                                                                                                                                                                                                                                                                                                             | Where                                                                                           |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Markup child dispatch**                  | text / comment (`<!--`, `@//`, `@/*`) / whitespace / element / control / done — a peek-guarded transition table (`accept(x, status, false)` = lookahead without consuming)                                                                                                                                                                         | `parseMarkup.ts:35-93`, `compile/parse/utils/accept.ts:14-21`                                   |
| **Element body loop**                      | same dispatch + `</` → `checkCloseTag` scans the open-element stack backwards; enter/exit bracketed by `stack.push`/`pop` (guard: not `selfClosed`/void); after the whole file parses, `classifyComponents` marks nodes as components from imports/local names (`@component[self]` also becomes a component with a synthesized `@replace` wrapper) | `parseElement.ts:44-152`, `classifyComponents.ts`, `ParseStatus.stack`                          |
| **Tag/attribute scanner**                  | `closeTag`, `snailed` (`@` prefix), `selfClosed` (`/>` or forced by close tag); attribute loop exits on `/>`/`>`, bails on unclosed tag; `reactive`/`fullyReactive` latches; attribute value 4-way first-char dispatch (`"`/`'`/`{`/bare) with `/>` rewind                                                                                         | `parseTag.ts:13-169`                                                                            |
| **Control-statement machine**              | operation-name accumulation with guarded breaks (`@async` swallows spaces; `:` only when `@default`; `(` only when `@html`); statement scanner with `parenCount`; unknown operation → error state                                                                                                                                                  | `parseControl.ts:105-196`                                                                       |
| **Branch grouping (`wrangleControlNode`)** | pairs branch operations onto group parents by scanning children backwards: `@if`→`@if group`, `@else` attaches + renamed `@else if`, `@for`, `@switch` renames itself, `@await`→`@await group`, `@with` attaches, `@try`→`@try group`, `@catch` attaches with duplicate guards, `@replace`, `@html`                                                | `parseControl.ts:204-333`; contract mirrored in codegen's "handled with the group" no-op states |
| **Branch lookahead**                       | after a control closes, peek (save/rewind) for `else                                                                                                                                                                                                                                                                                               | case                                                                                            | default | catch | with` → recurse or exit | `parseControl.ts:340-365` |
| **Text with reactive spans**               | prose / inside-`{expr}` (inner brace `level` counter) / boundary-found; `end === -1` latch patched on match; `@` only breaks with a newline-backtrack guard (so emails don't break)                                                                                                                                                                | `parseText.ts:20-64`                                                                            |
| **CSS parser**                             | selector → block \| attribute chosen by position lookahead (`nextColon < nextOpenBrace`); loop guard on `}`; nested fresh `ParseStatus` for the style section                                                                                                                                                                                      | `parseStyles.ts:23-99`                                                                          |
| **Speculative requirement parse**          | entry guards (top level, statement start, `data` + space); try-chain name → from → kind → `{`, **every failed transition rewinds** `status.i`; spec body paren counter; result patched into the script stream later via the exact sentinel `"/* @start */"`                                                                                        | `parseRequirement.ts:23-156`                                                                    |
| **`$watch` initializer scan**              | sticky regex (`/.../y` with `lastIndex`) → initializer state → balanced-paren `level` counter → record, resume                                                                                                                                                                                                                                     | `compile/build/restricted/scanState.ts:28-90`                                                   |

### Compiler codegen — `packages/view/src/compile/build`

| Machine                              | States                                                                                                                                                                                                                                                                                                                                                                                                        | Where                                                                                                                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`Builder` indent depth**           | `#space` incremented/decremented by scanning each emitted line's first/last char (`{`/`(`/`[` vs `}`/`)`/`]`); `#mapped` toggles the line-map-recording path; `;` at line start = "ignore line" (HACK); backtick content passes through verbatim                                                                                                                                                              | `compile/utils/Builder.ts:2-79`                                                                                                                                                          |
| **`BuildStatus` save/restore flags** | `ns` (SVG namespace; set on `<svg>` entry, restored on exit), `preserveWhitespace` (`pre`/`code`), `inHead` (flipped around `/* @head */`; consumed in every `t_run_*` signature), `varNames` monotonic counters                                                                                                                                                                                              | `BuildStatus.ts:7-25`; `buildElementNode.ts:33-58`; `buildCode.ts:247-249`; `nextVarName.ts:13-20`                                                                                       |
| **`handled` latch**                  | nodes anchored by a group control are built early (during fragment declaration) then latched so the tree walk consumes and skips them                                                                                                                                                                                                                                                                         | `buildFragment.ts:344, 763`, `buildNode.ts:25-28`                                                                                                                                        |
| **Two-pass fragment generator**      | `declare: boolean` selects completely different emissions per node (declarations vs `createXxx` calls); `useCreateElement` picks `let` vs `const`                                                                                                                                                                                                                                                             | `buildFragment.ts:38-107, 164-271, 447-534`                                                                                                                                              |
| **`VariablePath` machine**           | tree with type discriminant (`fragment` root / tag name / `text` \| `space` / `#` anchor); converts paths to DOM traversals and rewrites `t_next(t_next(x))` chains into `t_skip(x, n)` with a paren-depth counter; `varPaths` memo shortens later traversals; `"space"` is a transient state later string-replaced back to `t_next`                                                                          | `buildFragment.ts:766-872`                                                                                                                                                               |
| **`fragmentStack` scope**            | push/pop pairs around every branch/row/slot; consumer guard `throw new Error("No fragment on stack")`; empty stack → "probably in @head" early return                                                                                                                                                                                                                                                         | `BuildStatus.ts:15-18`; pushes in `buildRootNode`/`buildIfNode`/`buildSwitchNode`/`buildTryNode`/`buildAwaitNode`/`buildForNode`/`buildSlotNode`/`buildReplaceNode`/`buildComponentNode` |
| **Server output buffer**             | `output` accumulates literal HTML; `flushOutput` drains it into `t_head` vs `t_body` selected by `inHead`; every builder that emits JS must flush first                                                                                                                                                                                                                                                       | `build/server/flushOutput.ts:8-13`; flush points in `buildServerAwaitNode`/`buildServerControlNode`/`buildServerSlotNode`/`buildServerIfNode`/`buildServerCode`                          |
| **`awaitCount` sequence**            | monotonic per-chunk counter assigning `@await` boundary ids (used for the `<!--t-await:...-->` payload)                                                                                                                                                                                                                                                                                                       | `BuildServerStatus.ts:11-12`, `buildServerAwaitNode.ts:29`                                                                                                                               |
| **Generated branch FSMs**            | `buildIfNode` synthesizes an `@else` if none exists (so unmatched state clears content); `buildSwitchNode` synthesizes `@default`; each emits `let index = -1` + guarded `t_run_branch` + commit — **the generated runtime code is itself an FSM**                                                                                                                                                            | `buildIfNode.ts:23-103`, `buildSwitchNode.ts:21-107`                                                                                                                                     |
| **Two-callback emission**            | content callback → `}, (t_before) => {` + with/catch body, or `}, null` (absent-branch state); branch selection by `operation` discriminator                                                                                                                                                                                                                                                                  | `buildAwaitNode.ts:37-63`, `buildTryNode.ts:43-61`                                                                                                                                       |
| **Attribute dispatch**               | outer discriminator `fullyReactive` → `reactive` → none; inner name table (`&group`, `&value`/`&checked`, `onmount`, `on*`, `transition*`, `class`, `style`, data-/aria-); handler/binding pairing order selected by `first: handlerIndex < bindingIndex`; `bindEventName` input-type table; `buildBindAttribute` type table (`number` → `Number(...)`, `checkbox` → `checked`, `<select multiple>` diverges) | `buildElementNode.ts:175-482`                                                                                                                                                            |
| **`transition-in`/`out` pairing**    | three-way name state; `transition-in` peeks for a matching `transition-out`; `transition-out` checks whether it was already consumed (one-shot guard)                                                                                                                                                                                                                                                         | `buildElementNode.ts:541-586`                                                                                                                                                            |
| **`buildForNode` variant flags**     | `noWatch` / `singleVar` / `leafRow` each select a codegen variant; per-var bit-mask (`t_changed_mask                                                                                                                                                                                                                                                                                                          | = 1 << (forVarBitBase + i)`); `forVars`scope stack with bit position = stack depth;`forVarBindings`walks innermost-first with a`bound` dedupe Set                                        | `buildForNode.ts:84-311`, `compile/utils/forVars.ts:41-58` |
| **Restricted `Context` scope**       | `allowedRefs` starts `{"$props", "$data"}` and grows as `$watch` state is discovered; `loopVars` extended per `@for`; `elementStack` push/pop (guard: void tags, `@` names); `fillContext` resets stack + adds `"$slot"`; `needsClass` once-per-list latch                                                                                                                                                    | `build/restricted/buildRestricted.ts:42-61, 100-149, 342-346, 502-515, 697-720`                                                                                                          |
| **Interpolation-level machines**     | `level` counter where `level === 1` transitions open/close `t_fmt(` interpolations; `getAttributeOffsets` pushes spans with an `end: -1` sentinel patched when the matching `}` arrives; `buildTitleNode` uses a `reactiveStarted` latch + `reactiveCount`                                                                                                                                                    | `getAttributeOffsets.ts:22-62`, `buildTextNode.ts:20-63`, `buildServerTextNode.ts:15-45`                                                                                                 |
| **CSS selector scan**                | inside-selector / inside-`:global(...)` (`global` boolean set/cleared); `addSelector` appends the scoped class unless `global`                                                                                                                                                                                                                                                                                | `buildStyles.ts:48-100`                                                                                                                                                                  |
| **Whitespace trim**                  | bidirectional `seenBefore`/`seenAfter` latches in one pass classify each whitespace node as effectively-leading/trailing; `preserveAll` threaded through recursion                                                                                                                                                                                                                                            | `compile/utils/trimWhitespace.ts:63-116`                                                                                                                                                 |
| **Hydration marker protocol**        | ordered emission `HYDRATION_START_COMMENT` → branch-index comment → content → `HYDRATION_END_COMMENT` → `ANCHOR_COMMENT`                                                                                                                                                                                                                                                                                      | `buildServerIfNode.ts:21-51`, `buildServerSlotNode.ts:23-87`, `types/comments.ts`                                                                                                        |
| **Dispatch tables**                  | pure discriminator switches over `node.type` / `node.operation` / `tagName`; child branch operations all route to the "handled with the group, above" no-op state; invalid states throw                                                                                                                                                                                                                       | `buildControlNode.ts:13-92`, `buildNode.ts:30-63`, `buildServerNode.ts:20-53`, `buildSpecialNode.ts:15-38`                                                                               |
| **Build-target fork**                | `options.server` selects between mirrored client/server module trees (own status types, dispatch, emission); third target `buildRestricted` serializes to the tagged-union `RestrictedNode` tree; fourth minimal target for d.ts                                                                                                                                                                              | `compile/build.ts:32-34`                                                                                                                                                                 |
| **Dev boundary emission**            | `t_push_dev_bound(...)` / `t_pop_dev_bound();` pairs around every generated scope, guarded by `options.dev`; quote-state handling for the name                                                                                                                                                                                                                                                                | `addPushDevBoundary.ts:4-28`, `addPopDevBoundary.ts:4-10`                                                                                                                                |
| **Explicit (formal) discriminators** | for contrast, these _are_ explicit unions: `RestrictedExpr.op` (10 ops), `RestrictedNode.t` (5), `RestrictedDynamicAttribute.format`, `NodeType`, `OperationType` (25 variants), `Token.type`, `StyleNode.type`, `CommentNode.commentType`                                                                                                                                                                    | `build/restricted/types.ts:44-128`, `types/nodes/*`                                                                                                                                      |

### Dev instrumentation — `packages/view/src/dev`

| Machine                          | States                                                                                                                                                                                                                                                                                                                                                               | Where                                                                               |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **`DevContext` instrumentation** | `DISABLED` (noop hooks) → `ENABLED` (installed by `setDevMode`, the single transition); `depth` nesting counter; `index === -1` sentinel selects append vs positioned-insert mode; `onRegionPushed` distinguishes new-region vs re-entry (id pattern `/.+?\[(.+?)\]/`); `oldDepths` save/restore stack; `onRegionCleared` walks the chain deleting boundary subtrees | `dev/devContext.ts:8-30`, `dev/setDevMode.ts:77-213`, `dev/pushDevBoundary.ts:4-25` |
| **`DevBoundary` tags**           | `"component" \| "region" \| "run" \| "watch" \| "control" \| "branch"` — only `"run"` has a real `getDetails` implementation                                                                                                                                                                                                                                         | `dev/types/DevBoundary.ts:2`, `setDevMode.ts:26-34`                                 |

### Router / dev server — `packages/build/src`

| Machine                            | States                                                                                                                                                                                                                                                                                                                                        | Where                                                                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **`$page` per-runtime init**       | client: one `$watch`ed object memoized on a `globalThis` slot (`Symbol.for("torp.Page")`); server: one plain object per request, created on first use (keyed by the event); both reach components as `$context.$page`; field states: `status` ∈ 404→200→error, `form` ∈ undefined→record→reset, `flash` ∈ undefined→consumed-on-read, `error` | `state/$page.ts` (client), `site/requestPage.ts` (server, per request), `types/PageState.ts` |
| **Prefetch cache entries**         | per key: `absent → warmed (in-flight promise) → consumed (deleted by the navigation it was for)` \| `dropped-on-failure`; a rejection deletes itself, **identity-guarded** (`if (prefetchedData[key] === promise)`) so a newer entry isn't evicted by an older failure                                                                        | `nav/loadData.ts:230-274, 451-488`, `state/client.ts:3-15`                                   |
| **Deferred data store**            | per id: `unregistered → registered (rejection pre-swallowed) → resolved \| rejected (entry deleted)`; stream end force-rejects stragglers (`"The deferred data stream ended before a value arrived"`)                                                                                                                                         | `nav/loadData.ts:156-218`, wire types in `deferred.ts:6-32`                                  |
| **Form-submit dispatcher**         | status/header transition table: `200` + attachment → blob download; `200` + `X-Torpor-Form-Redirect` → `load(redirect)` then `location.href`; `2xx\|4xx` → `$page.form = json` + reload; `≥500` → `document.write` or `location.reload`                                                                                                       | `nav/formSubmit.ts:41-83`; server side `runAction` in `site/serverHandlers.ts:1179-1241`     |
| **Embedded server-data one-shot**  | script tag present → parsed & removed → absent forever ("consumed once, so later navigations use the fetch")                                                                                                                                                                                                                                  | `nav/loadData.ts:238-244, 403-419`                                                           |
| **Session lifecycle**              | `absent → valid (HMAC + expiry verified) → written → regenerated (fixation prevention) → destroyed`; verify ladder: no `"."` → invalid; HMAC → invalid; JSON → invalid; shape/expiry → invalid                                                                                                                                                | `server/SessionHelper.ts:48-188`                                                             |
| **Flash one-shot**                 | `unset → set → read-and-cleared in the same call` ("the message shows exactly once"); edge state: set-and-consumed in the same request without reaching the browser                                                                                                                                                                           | `server/FlashHelper.ts:51-81`; consumed into `$page.flash` at `serverHandlers.ts:760`        |
| **Form-action branching (server)** | client-submit header on → passthrough with redirects converted to `X-Torpor-Form-Redirect`; no-JS → re-render with `$page.form` populated and `fromForm` sticky flag (skips server hooks: "hooks already ran"); reserved-name guard throws for `load`/`params`                                                                                | `site/serverHandlers.ts:1095-1246`, `loadView` at 812                                        |
| **Route-type tagged dispatch**     | numeric union `PAGE_ROUTE=0 … ERROR_ROUTE=8 \| -1`; `switch (handler.type)` with method routing gated per tag; `-1` → `notFound()`                                                                                                                                                                                                            | `types/RouteType.ts:1-19`, `Site.ts:301-321`, `serverHandlers.ts:247-306`                    |
| **Handler lazy resolution**        | `unloaded → loading → resolved (resolvedModule / resolvedServerModule / resolvedHooks)` — the resolved _value_ is cached per handler, never the loader promise (a request that ends before it settles would strand it on workerd); dev skips the cache so edited modules are picked up                                                        | `site/Router.ts:54-75`, `serverHandlers.ts:349-408`, `types/RouteHandler.ts:18-26`           |
| **Cookie/header overrides**        | two-state per name: request-value → overridden (Map wins); `delete()` = set-to-empty + `expires: epoch` (state encoded as an expired cookie)                                                                                                                                                                                                  | `server/CookieHelper.ts:11-22`, `server/HeaderHelper.ts:9-16`                                |
| **NDJSON/HTML streams**            | open → cancelled (`cancelled` latch checked in `finally` and try/catch) \| closed; frames: first `{type: "data", loads, deferred}` then `{type: "value"\|"error", id}`; bootstrap store guard won't replace a store that still holds pending promises                                                                                         | `site/serverHandlers.ts:661-713, 1028-1093`                                                  |
| **Response body variants**         | plain string \| critical JSON + `[INTERNAL_RESPONSE_BODY]` original + `[INTERNAL_RESPONSE_DEFERRED]` (only when deferreds exist); read side prefers raw body "so deferred promises survive"                                                                                                                                                   | `response/response.ts:13-42`, `response/internal.ts:8-16`, `response/read.ts:8-29`           |
| **Middleware enter/exit**          | see Tier 1 #9                                                                                                                                                                                                                                                                                                                                 | `server/runHooks.ts`; `server/Server.ts`, `site/serverHandlers.ts` (call sites)              |
| **Navigation mutex**               | see Tier 1 #8                                                                                                                                                                                                                                                                                                                                 | `nav/navigate.ts:13-50`                                                                      |
| **Navigation outcomes**            | each ending in `return false` = "caller must full-page load": no `#app` → no route → error route rendered → no client component → load redirected → load errored (layout stack reset) → error page's own load failed → success                                                                                                                | `nav/navigate.ts:52-173`                                                                     |
| **Dev startup ordering**           | config → dep cache validated → env loaded → **`warmServerEntry` before `vite.listen()`** ("dropping any request in flight at that moment") → watching; warmup failure swallowed unless `TORPOR_DEBUG_WARMUP`                                                                                                                                  | `run/runDev.ts:39-178`                                                                       |
| **Dep-cache fingerprint**          | no store → fingerprint match (keep) → mismatch (`rmSync`, `cleared = true`) → store rewritten; "Never break dev startup over cache bookkeeping"                                                                                                                                                                                               | `run/depCache.ts:64-94`                                                                      |
| **Route watcher queue**            | promise-serialized reload queue (folder renames can't interleave; a bad config save can't crash the server); event routing table (`change` → recheck+conditional reload; `add` → recheck+reload if config-dep or in-route-folder; `unlink*` → reload only); `reported` map dedupes "only when a file's issues change"                         | `run/runDev.ts:192-304`                                                                      |
| **Route-table hot swap**           | two-tier: route-relevant fields hot-swappable via `applyRouteState`; `adapter`/`vitePlugins`/`viteConfig`/`inputs` deliberately frozen ("changing those needs a restart anyway")                                                                                                                                                              | `site/Site.ts:236-251`                                                                       |
| **Dev plugin handler**             | `handlerPromise` started eagerly in `configureServer`; every request awaits it; errors → `next(e)`                                                                                                                                                                                                                                            | `run/devPlugin.ts:27-44`                                                                     |
| **Stale-copy drift**               | per package: in-sync → drift (missing / differs / leftover), reported once at startup; never throws unless `TORPOR_DEBUG_CACHE`                                                                                                                                                                                                               | `run/staleTorpCopies.ts:24-71`                                                               |
| **devMode + warn-once**            | `devMode` module flag set by `createServerLoad(dev)`; `warnedEmbedRoutes: Set` warns once per route path                                                                                                                                                                                                                                      | `site/serverHandlers.ts:50-76`                                                               |
| **Prerender outcomes**             | per entry: `written` \| `skipped` (redirect, "expected on a fresh site") \| `failure` (collected then thrown); error-page sub-loop over `[404, 500]` with `break` on redirect; 5-level flag precedence chain (page → server → nearest layout → site map → skip)                                                                               | `run/runPrerender.ts:44-234`                                                                 |
| **Env validation cache**           | per source (WeakMap): unvalidated → validated+cached; async schemas hard-throw; module-level schema unset → set                                                                                                                                                                                                                               | `env.ts`                                                                                     |
| **CLI mode dispatch**              | `--openapi` \| `--dev` \| `--build` \| `--preview` with `try/finally vite.close()`                                                                                                                                                                                                                                                            | `bin/index.ts`                                                                               |

### Adapters — `packages/adapters`

| Machine                         | States                                                                                                                                                                                                                                                                                                                                                                                                     | Where                                                      |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Electron teardown**           | `child: undefined → spawned`; `quitting` latch selects two exit paths — child `exit` while `!quitting` → user quit → `server.close()`; httpServer `close` → `quitting = true; stopChild()` (kill without re-closing). Production: `shuttingDown` latch in `before-quit`, flush/stop raced against 1500 ms; window lifecycle `show:false → ready-to-show → show()`, `activate` re-creates when zero windows | `adapter-electron/electronDev.ts:21-70`, `main.mjs:98-120` |
| **Node HTTP upgrade**           | raw request → `INTERNAL_UPGRADE` pair attached → `101` ("handler owns the socket") \| other status → reject (write + `socket.end`) \| throw → 500, guarded by `!socket.destroyed && !socket.writableEnded`                                                                                                                                                                                                 | `adapter-node/createUpgradeHandler.ts:17-56`               |
| **Response body-kind dispatch** | 8-way type tag — null/string/Uint8Array/Blob/ArrayBuffer/view/FormData/ReadableStream; stream arm does `writeHead + flushHeaders + pipeline` (SSE path)                                                                                                                                                                                                                                                    | `adapter-node/responseToNodeResponse.ts:8-61`              |
| **Cloudflare dev template**     | `templatePromise ??= buildDevTemplate(...)` — unconfigured → configured-once                                                                                                                                                                                                                                                                                                                               | `adapter-cloudflare/cloudflareDev.ts:43-56`                |

### Unplugin — `packages/unplugin`

| Machine                                     | States                                                                                                                                                                                                                                 | Where                           |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| **Scoped-CSS registry with negative cache** | per `<hash>.css` id: present (populated by `transform` side effect) → on a miss, recoverable (`rebuildStyle` re-derives) → permanently missing (`missing.add(hash)`, "so a genuinely missing style isn't re-scanned on every request") | `src/index.ts:10-24, 221-245`   |
| **Compile-target resolution**               | precedence chain `?client` override → `viteOptions.ssr` → `options.test` (forces server) → default; plus a `torporPackages` memo for the "ships `.torp`" predicate                                                                     | `src/index.ts:111-150, 403-426` |

### UI components — `packages/ui/src`

| Machine                      | Components                                                                                                                   | States                                                                                                                                                                                                                                                                                           | Where                                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **Popout open/closed**       | Popover, Modal, Drawer, Menu, MenuBar, Submenu, Contextual, DatePicker, ComboBox, SelectBox, CommandPalette (~15 components) | see Tier 1 #13                                                                                                                                                                                                                                                                                   | `utils/popoutContent.ts:40-178`                                                                                    |
| **Hover open**               | PopoverHover, Contextual hover, SubmenuPopoutTrigger                                                                         | simple: idle → pending-open timer → open (mousemove resets timer); rich: `closed → openPending (hoverDelay 500) → open → closePending (exitGrace 300)`, entering content cancels close; scripted refocus ignored via `consumeFocusOpenSuppress()`                                                | `utils/hoverOpen.ts:5-50`, `utils/hoverReveal.ts:45-255`                                                           |
| **Focus trap**               | Dialog, ModalContent, PopoverContent                                                                                         | open-with-focus-inside (Tab/Shift+Tab wrap over `focusableElements`), closed; Escape → clicks cancel button, Enter → confirm; **modal mode inverts outside-click: prevents closing**                                                                                                             | `mount/trapFocus.ts:5-58`, `Dialog/Dialog.torp:50-120`                                                             |
| **Item-group selection**     | Accordion, TabGroup, ListBox, Tree (two groups over one state), MenuCheck, MenuRadioGroup, SegmentedControl, Rating          | per-item selected state **derived** via `$cache` over the group value (can never drift); `toggleItem`: single+allowDeselect → `undefined`; single → canonical value; multiple → rebuilt sorted array; `parentDisabled` propagated                                                                | `utils/createItemGroup.ts:32-152`                                                                                  |
| **Roving tabindex**          | MenuBar, ToolBar, Rating, SegmentedControl                                                                                   | `focusIndex = -1` sentinel ⇒ item 0 is the tab stop (`isTabStop`); transitions on focus/arrow keys/Home/End, orientation-gated                                                                                                                                                                   | `utils/focusGroup.ts:72-204`                                                                                       |
| **Combobox family**          | ComboBox, SelectBox, TagInput, CommandPalette                                                                                | closed+typed-text vs open+highlighted-option (`activeDescendant`) + `searchText`; arrows clamp; Enter commits highlighted suggestion over raw text; CommandPalette adds mod+k hotkey toggle; TagInput: Backspace-on-empty pops last tag, suggestions fetch only while open                       | `ComboBox/ComboBoxInput.torp:88-155`, `TagInput/TagInput.torp:83-290`, `CommandPalette/CommandPalette.torp:64-193` |
| **Pointer drag**             | Slider, SplitterHandle                                                                                                       | idle → dragging → idle; mousedown attaches **window** mousemove/mouseup; cleanup if unmounted mid-drag                                                                                                                                                                                           | `Slider/Slider.torp:172-203`, `Splitter/SplitterHandle.torp:34-77`                                                 |
| **HTML5 drag-and-drop**      | any draggable/droppable (list/tree reorder)                                                                                  | module-level singleton `dragState` ("drags don't nest"); per-target idle → hovered (`hoverClassApplied`) → dropped/rejected; source `onstart` returning false cancels; `dragleave` ignored while `relatedTarget` is inside; `reorderList` is pure index math                                     | `utils/dragState.ts:28-86`, `mount/draggable.ts:28-63`, `mount/dropTarget.ts:40-108`, `utils/reorderList.ts:8-52`  |
| **Async load**               | DataGrid, Tree lazy children, ComboBox, TagInput, SelectBox, ListBox                                                         | reads suspend via `$async`; DataGrid adds `reloading` + `loadGeneration` (**only the latest generation may clear `reloading`**), stale-rows-with-`aria-busy`, sort machine (same column asc⇄desc, new column resets asc), virtual window; Tree lazy gate `started` flips on first expansion only | `utils/loader.ts:91-113`, `DataGrid/DataGrid.torp:230-301, 453-524`, `Tree/TreeLoadedChildren.torp:88-95`          |
| **Step progression**         | Stepper                                                                                                                      | clamped step index; `next()` guarded by `canNext`, past the last step fires `oncomplete` instead; `linear` flag declares ordered-only visiting                                                                                                                                                   | `Stepper/Stepper.torp:43-120`                                                                                      |
| **Segmented typing buffers** | TimePicker                                                                                                                   | per-segment buffers (`hourText`/`minuteText`/`secondText`) vs committed value; commit clears the buffer — "a non-empty buffer always means uncommitted typing that sync must not overwrite"                                                                                                      | `TimePicker/TimePicker.torp:103-131`                                                                               |
| **Timed notification**       | Notification, NotificationContainer                                                                                          | visible on mount → `setTimeout(close, duration ?? 5000)` → `visible = false` + `onclose`                                                                                                                                                                                                         | `Notification/Notification.torp:28-57`                                                                             |
| **Dead code**                | —                                                                                                                            | `mount/clickPopover.ts` and `mount/hoverPopover.ts` are fully commented out; the live machinery is `popoutContent.ts`/`hoverOpen.ts`/`hoverReveal.ts`                                                                                                                                            | `mount/`                                                                                                           |

### Embed / language-server / check / dev-tools

| Machine                          | States                                                                                                                                                                                                                                                                                                                                                                                | Where                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Frame bridge RPC**             | see Tier 1 #14; host-side reply machine: `invoke` → await → post result/error; `event` → emit; `height` → clamp + set                                                                                                                                                                                                                                                                 | `embed/src/frame/frameBridgeScript.ts:36-82`, `listenEmbedFrame.ts:56-88`        |
| **Height reporting**             | initial (`readyState === "complete"` → immediate, else one-shot `load` listener) → continuous (ResizeObserver on body)                                                                                                                                                                                                                                                                | `frameBridgeScript.ts:59-68`                                                     |
| **Frame lifecycle**              | `mountEmbedFrame.unmount()` disposes listener **and** clears `srcdoc` to kill the frame                                                                                                                                                                                                                                                                                               | `embed/src/frame/mountEmbedFrame.ts:59-66`                                       |
| **Embed loader (globals)**       | `unevaluated → cached (WeakMap componentCache) → mounted/hydrated → unmounted` (unmount = `unmount(target)` + `removeStyles`)                                                                                                                                                                                                                                                         | `loader/prepare.ts:22-59`                                                        |
| **Embed loader (module)**        | `absent → loading (promise stored *before* resolution, so concurrent mounts share one load) → loaded \| failed → absent (retry)`: **"Don't cache rejections: a transient load failure shouldn't poison every future mount"**                                                                                                                                                          | `loader/prepareModule.ts:28-59`                                                  |
| **Style dedupe**                 | absent → injected (guarded by `style[data-torpor-embed]` query); `removeStyles` clears                                                                                                                                                                                                                                                                                                | `loader/injectStyles.ts:12-32`                                                   |
| **Version gate**                 | match → run \| mismatch → throw `EmbedVersionError` \| mismatch → warn-and-continue (`allowMismatch`); `recompileEmbed` is the documented recovery transition                                                                                                                                                                                                                         | `embed/src/checkVersion.ts:16-29`, `compile/recompileEmbed.ts:20-26`             |
| **Render timeout (in-process)**  | rendering → resolved \| soft-timeout (promise rejects; render keeps running; orphan result swallowed via `render.catch(() => {})`)                                                                                                                                                                                                                                                    | `server/renderInProcess.ts:29-57`                                                |
| **Render timeout (worker)**      | spawned → `{result}` → resolved \| `{error}`/`"error"`/`exit≠0` → rejected \| timeout → `terminate()` + rejected; timer always cleared in `finally`                                                                                                                                                                                                                                   | `server/renderInWorker.ts:25-75`, `worker/renderWorker.ts:22-70`                 |
| **Render service gauntlet**      | route check (`GET /version` → 200; else POST `/render` or 404) → bearer (SHA-256 + `timingSafeEqual` → 401) → body cap (413, socket killed on response finish) → JSON parse (400) → slots-forbidden (400) → render (200 / `EmbedVersionError`→409 / 500); `readBody` sub-machine: receiving → over-limit (`done` latch makes later chunks no-ops) \| end \| error                     | `server/service/startRenderServer.ts:87-212`                                     |
| **http source validation chain** | discrete rejection states: url parse → scheme → embedded-credentials → `allowOrigins` (default deny) → blocked-hostname (private/loopback) → params → credentials → fetch (`redirect: "error"`, timeout) → `response.ok` → content-type → byte cap → parse → pickPath → row limit                                                                                                     | `embed/src/restricted/http/createHttpSource.ts:80-197`                           |
| **Warn-once latches**            | `silent → warned` per channel (`warnedEvent`, `warnedInvoke`); unlatched per-call `noSource()` warning                                                                                                                                                                                                                                                                                | `embed/src/bridge/createBridge.ts:18-54`, `worker/renderWorker.ts:22-38`         |
| **Compile gauntlet**             | linear terminal-rejection chain: max bytes → parse → default-export lookup → client build → import scan + scope allowlist → server build → artifact stamped (format selects the loader machine)                                                                                                                                                                                       | `embed/src/compile/compileEmbed.ts:77-147`                                       |
| **LSP model cache**              | per URI: `absent → cached (version+languageId hit → touch) → evicted (LRU at full) \| expired (interval)`; explicit removal on doc close; `dispose()` wipes                                                                                                                                                                                                                           | `language-server/src/languageModelCache.ts:14-86`                                |
| **Validation staleness**         | async diagnostics dropped if `document.version` advanced during validation                                                                                                                                                                                                                                                                                                            | `language-server/src/server.ts:93-116`                                           |
| **vts bootstrap**                | module-singleton: `uninitialized → initialized` (one-time latch; **never re-initialized** — TODO in code for tsconfig reload); per-file virtual doc: absent → created (exactly once) → updated forever                                                                                                                                                                                | `language-server/src/script/loadDocument.ts:22-138`, `check/src/loadVts.ts:8-75` |
| **LSP process lifecycle**        | `created → initialized (onInitialize) → serving → shutdown`; `languageModes` undefined until initialize; transport gate defaults to `--stdio`                                                                                                                                                                                                                                         | `language-server/src/server.ts:28-47, 215-220`, `bin/index.ts:7-10`              |
| **Per-request mini-FSM**         | every handler repeats: `documents.get(uri)` → `if (!document) return null` → mode lookup → `if (!mode?.doX) return null` → dispatch                                                                                                                                                                                                                                                   | `server.ts:118-213`                                                              |
| **Dev-tools panel**              | inspect-result triage: `exception → error shown` \| `no result → warning shown` \| `ok → loaded` (each branch clears the competing fields); per-boundary expand/details latch; `recent` highlight with trailing-reset 2s debounce (single shared timer, last event wins); tab `onActivated` → immediate reload, `onUpdated` → 100ms delayed reload; panel tab mode `"ui" \| "events"` | `dev-tools/src/entrypoints/devtools-panel/main.ts:8-213`, `Panel.torp:4-73`      |
| **Check CLI**                    | one-shot pipeline, no watch states: arg resolution (no arg → cwd; not found → error, `errors` stays `[]`) → `loadVts` (bootstrap latch; `undefined` → return `[]`) → glob include/exclude → per-file `loadDocument` (errors accumulate) → `ts.createProgram` → diagnostic families → `processErrors`                                                                                  | `check/src/bin/index.ts:10-35`, `check/src/check.ts:12-74`                       |

---

## Recurring idioms (the codebase's informal FSM vocabulary)

The same ~12 idioms recur everywhere, which is effectively this codebase's
unwritten state-machine library:

1. **Boolean latches** — one-way flags: `warnedEvent`, `handled`,
   `firstBackward`, `cancelled`, `quitting`, `degraded`, `started`, `closing`
2. **Consumed-once artifacts** — `takeBranchIndex`, embedded-data script
   removal, flash cookie read-and-delete, `recreate` flag, `handled` latch
3. **Generation counters** — the standard answer to stale async work:
   `$async.generation`, `region.generation`, DataGrid `loadGeneration`,
   LSP document version
4. **Save/restore pointers** — module-level "current" contexts restored in
   `finally`: `withServerAwait`, `currentServerReadSite`, `suspendPeek`,
   `status.ns`, `forVars`, hydration cursor
5. **Promise-chain queues** — serialization via
   `let pending = Promise.resolve(); pending = pending.then(...).catch(...)`
   (navigation mutex, route watcher)
6. **Promise maps** — RPC correlation (`calls[id]`, `DeferredStore`), with the
   non-poisoning variant (`namespaceCache` deletes on reject so failures retry)
7. **`??=` memoization** — lazy one-time init (`resolvedModule`,
   `templatePromise`, `$page`'s `globalThis` slot, vts env)
8. **Negative caches** — `missing.add(hash)` in unplugin, `reported` map in
   the route watcher
9. **Depth counters** — brace/paren/level counting everywhere:
   `ParseStatus.level` + `braces[]`, `Builder.#space`, hydration marker
   `level`, `t_skip` rewriter, CSS parser lookahead, `batch` nesting
10. **Tombstones** — dead-but-recognizable states: region `depth = -2` /
    `generation = -1`
11. **Sentinel strings** — parser→codegen protocol (`/* @render */`,
    `<!--t-await:-->`, `"/* @start */"`, hydration bracket comments `<![>`
    … `<!]>`)
12. **Timeout races** — `Promise.race` against degradation: server `@await`
    boundary (soft — degrade to fallback), embed render (soft and hard
    terminate variants), service client (`AbortSignal.timeout`)

---

## Latent quirks the machines surfaced

Issues found while mapping these — each is a place where an implicit machine
is missing a state:

- **`frameBridgeScript.ts`** — pending bridge calls have no timeout state; a
  lost reply pends forever and leaks the entry.
- **`languageModelCache.ts`** — LRU evicts only when _already full_
  (grow-by-one past `maxEntries` before shrinking), and the cache can only
  evict one entry per miss.
- **`loadDocument.ts` / `loadVts.ts`** — the vts environment never
  re-initializes when tsconfig changes (acknowledged TODO in code).
- **`runServerAwait.ts:70-83`** — a boundary rendered outside any
  `t_server_flush` root registers no sentinel and never awaits `final`; no
  guard throws (reachable only if compiled code violates the flush-root
  convention).
- **`devtools-panel/main.ts`** — a single shared 2s timer serves all
  boundaries' `recent` flags; one late event extends everyone's highlight.
- **Dead code** — `mount/clickPopover.ts` and `mount/hoverPopover.ts` are
  fully commented out, superseded by `popoutContent.ts`/`hoverReveal.ts`.
- **Duplicated logic** — ~~the middleware enter/exit pattern was implemented
  three separate times in `packages/build/src`~~ **fixed**: all eight
  enter/exit sites now share one `runHooks` implementation
  (`packages/build/src/server/runHooks.ts`).

---

## Should any of these be formalized?

The short version: the latches, counters, and promise maps are fine as they
are — they're idiomatic and local. The candidates worth considering are the
ones where states are _distributed across multiple interacting booleans on one
object_ — not because they're broken, but because a small tagged-union `state`
field with a few transition functions would make illegal states
unrepresentable and give tests a vocabulary.

Progress on the short list:

- **Done — `$async` settle latch**: the `hasResolved`/`lastErrored`/
  `staleValue` cluster on `Computed` was collapsed into a single
  `settle: AsyncSettle | undefined` union (`types/AsyncSettle.ts`), mirroring
  the SSR side's `ServerPromiseEntry.result` shape.
- **Done — middleware enter/exit dedupe**: the eight copies of the
  enter/short-circuit/reverse-exit machine now share one `runHooks`
  implementation (`packages/build/src/server/runHooks.ts`), which also makes
  the documented "exit can replace the response" contract uniform across
  `Server.fetch`, route middleware, and global middleware.
- **Done — dev-only invariant checks**: `dev/devAssert.ts` throws on machine
  corruption when dev mode is enabled (`setDevMode`), and is one boolean read
  in production. Currently guards: the batch counter (`batchEnd` without a
  matching `batchStart`), the signal update chain's head/tail pairing
  (`propagateSignal`), and the `$async` settle machine (a generation-guarded
  settle arriving while `didSuspend` is false). Pinned by
  `test/dev/devAssert.test.ts`.
