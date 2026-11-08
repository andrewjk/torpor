import context from "../render/context";
import type AsyncOptions from "../types/AsyncOptions";
import type Computed from "../types/Computed";
import { COMPUTED_TYPE } from "../types/constants";
import devAssert from "../dev/devAssert";
import batchEnd from "./batchEnd";
import batchStart from "./batchStart";
import { propagateFromSignal } from "./propagateSignal";
import runComputed from "./runComputed";

/**
 * Caches an async computed value from a thunk that returns a Promise. A peer
 * of `$cache` for async getters: the returned Computed carries a `didSuspend`
 * indicator that the proxy get trap reads to suspend callers until the promise
 * resolves.
 *
 * The thenable check and `.then` wiring live inside `computed.run` (a closure
 * over the computed object), so they fire on both the initial run and every
 * recalculation — `runComputed` and `checkComputed` are unchanged.
 *
 * Hydration seeding (ASYNC.md → "Server rendering"): while hydrating the content branch of
 * a boundary whose server HTML embedded resolved `source: "server"` values,
 * `context.serverValues` is set, and this read consumes the value at the
 * current position instead of suspending. The thunk still runs — once, in
 * the background — so the getter's dependencies are tracked and later
 * dependency changes re-fetch; the embedded value wins the generation race,
 * so there's no re-fetch wait and no fallback flash.
 *
 * @param fn A thunk returning the Promise to await. Signal reads inside `fn`
 *   are tracked, so the fetch re-runs when dependencies change. With
 *   `source: "server"`, the thunk receives the server-resolved value (if any)
 *   as its argument on the client's first (hydration) run, so it can return it
 *   unchanged to skip expensive work the server already did. Later runs (a
 *   dependency change, a `$refresh`, or a client-side navigation with no
 *   server value) receive `undefined`. Reads still have to happen before any
 *   early return for their changes to be tracked. Annotate the thunk's return
 *   type (e.g. `async (server): Promise<string> => …`) when the result type
 *   isn't inferable from the thunk's body alone.
 * @param _options Accepted so the same getter source compiles into client and
 *   server builds (`source: "server"` fetches during SSR); ignored here.
 */
export default function $async<T>(fn: (serverValue?: T) => Promise<T>, _options?: AsyncOptions): T {
	if (context.registerComputed === null) {
		throw new Error("$async must be used in a getter");
	}

	const computed: Computed = {
		type: COMPUTED_TYPE,
		isAsync: true,
		value: null,
		run: null as unknown as () => any,
		firstSource: null,
		firstTarget: null,
		recalc: false,
		running: false,
		didError: false,
		didSuspend: false,
		generation: 0,
		settle: undefined,
		suspendQuiet: false,
		rollback: null,
	};

	// During hydration of a `source: "server"` boundary, this read's resolved
	// value has already been shipped by the server. Peek it before the first
	// run so the thunk can return it unchanged and skip expensive work the
	// server has already done (a syntax highlighter, say). The thunk still
	// runs, so its dependencies are still tracked; only the first run receives
	// the value — later runs (a dependency change, `$refresh`, or a
	// client-side navigation with no server value) receive `undefined`.
	const serverValues = context.serverValues;
	const serverValue: T | undefined =
		serverValues !== null && serverValues.index < serverValues.values.length
			? (serverValues.values[serverValues.index] as T)
			: undefined;
	let firstRun = true;

	// The runner wraps the user's thunk: call fn(), and if the result is a
	// thenable, set didSuspend + wire the resolve/reject handlers. This runs
	// inside runComputed (with activeTarget set for dep tracking) on both the
	// initial call and every recalc, so stale resolves are handled by the
	// generation guard without any changes to runComputed or checkComputed.
	//
	// `settle` is maintained by the settle handlers below — it always holds
	// the last SETTLED result, so readers never see a superseded run's
	// in-flight promise (rapid prop changes would otherwise render "[object
	// Promise]" — a superseded generation's value leaking into the UI). The
	// settle handlers are generation-guarded, so `settle` is
	// generation-safe by construction: the read-side token matching the
	// resolve-side one (ASYNC.md → "Generation guards").
	computed.run = () => {
		const value = fn(firstRun ? serverValue : undefined);
		firstRun = false;
		if (value !== null && value !== undefined && typeof (value as any).then === "function") {
			const gen = ++computed.generation;
			computed.didSuspend = true;
			// Capture the quiet-on-refresh decision at suspend time
			// (ASYNC.md → "Loud vs quiet"). `recalc` is still true during a source-driven
			// re-run — `checkComputed` clears it only after `runComputed`
			// returns — so a suspend is quiet iff the computed has settled
			// before AND this run wasn't triggered by a dependency change
			// (i.e. a silent `$refresh(fn, { silent: true })`).
			// First loads are loud (`settle` is undefined); dep-change
			// refreshes and loud `$refresh` calls are loud (`recalc` is true).
			computed.suspendQuiet = computed.settle !== undefined && !computed.recalc;
			(value as Promise<T>).then(
				(v: T) => {
					if (computed.generation !== gen) return;
					// The generation guard passed, so this is still the run that
					// suspended — the settle machine's pending flag must be set
					devAssert(
						computed.didSuspend,
						"$async: resolved while not suspended (settle bookkeeping is broken)",
					);
					computed.value = v;
					computed.didSuspend = false;
					// Retain the resolved value for the next refresh suspend
					// (stale-while-revalidate, ASYNC.md → "Stale-while-revalidate")
					computed.settle = { ok: true, value: v };
					batchStart();
					propagateFromSignal(computed);
					batchEnd();
				},
				(e: any) => {
					if (computed.generation !== gen) return;
					devAssert(
						computed.didSuspend,
						"$async: rejected while not suspended (settle bookkeeping is broken)",
					);
					computed.value = e;
					computed.didError = true;
					computed.didSuspend = false;
					// A retry-after-error re-suspend must not hand the previous
					// error (or a pre-error value) to readers as "stale content"
					// — the `ok: false` settle leaves no stale value to serve
					computed.settle = { ok: false, error: e };
					batchStart();
					propagateFromSignal(computed);
					batchEnd();
				},
			);
		}
		return value;
	};

	context.registerComputed(computed);

	runComputed(computed);

	// Hydration seeding: the server embedded a resolved value for this read.
	// Bump the generation so the background fetch's settle is dropped as
	// stale, and surface the embedded value instead — the reader sees the
	// server's data immediately
	if (serverValues !== null && serverValues.index < serverValues.values.length) {
		computed.generation++;
		computed.didSuspend = false;
		computed.didError = false;
		computed.value = serverValues.values[serverValues.index++];
		computed.settle = { ok: true, value: computed.value };
	}

	return computed.value;
}
