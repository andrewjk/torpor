import type Computed from "../types/Computed";
import { COMPUTED_TYPE } from "../types/constants";
import runComputed from "../watch/runComputed";
import context from "./context";

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
		value: null,
		run: fn,
		firstSource: null,
		firstTarget: null,
		recalc: false,
		running: false,
		didError: false,
		rollback: null,
		//name: dev.effectName(fn),
	};

	context.registerComputed(computed);

	runComputed(computed);

	return computed.value;
}
