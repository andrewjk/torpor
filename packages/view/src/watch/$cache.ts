import context from "../render/context";
import type Computed from "../types/Computed";
import { COMPUTED_TYPE } from "../types/constants";
import runComputed from "./runComputed";

/**
 * Caches a computed value from signals accessed in a property getter.
 *
 * @param fn The function containing the signals to compute and cache.
 */
export default function $cache<T>(fn: () => T): T {
	if (context.registerComputed === null) {
		throw new Error("$cache must be used in a getter");
	}

	let computed: Computed = {
		type: COMPUTED_TYPE,
		isAsync: false,
		value: null,
		run: fn,
		firstSource: null,
		firstTarget: null,
		recalc: false,
		running: false,
		didError: false,
		didSuspend: false,
		generation: 0,
		hasResolved: false,
		lastErrored: false,
		suspendQuiet: false,
		staleValue: undefined,
		rollback: null,
		//name: dev.effectName(fn),
	};

	context.registerComputed(computed);

	runComputed(computed);

	// Guard: a Promise return from $cache would be cached as a raw value and
	// never suspend — the value would render as [object Promise]. This runtime
	// guard is the enforcement (torpor doesn't parse JS statically, so there's
	// no compiler check — ASYNC.md §7.2); it fires on the getter's first read.
	if (
		computed.value !== null &&
		computed.value !== undefined &&
		typeof (computed.value as any).then === "function"
	) {
		throw new Error("$cache returned a Promise — use $async for async getters");
	}

	return computed.value;
}
