import context from "../render/context";

/**
 * Runs a function without tracking the reactive values it reads: `$watch`'d
 * state accessed inside `fn` does not become a dependency of the currently
 * running effect or computed. Useful for reading state inside an effect
 * without re-running it when that state changes.
 *
 * @param fn The function to run untracked.
 */
export default function $peek<T>(fn: () => T): T {
	const oldActiveTarget = context.activeTarget;
	context.activeTarget = null;

	try {
		return fn();
	} finally {
		// Restore even if `fn` throws: otherwise the rest of the running
		// effect (if the caller catches) would stay untracked, so its later
		// reads would never re-run it
		context.activeTarget = oldActiveTarget;
	}
}
