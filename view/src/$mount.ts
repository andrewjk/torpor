import context from "./render/context";
import type Cleanup from "./types/Cleanup";

/**
 * Runs and re-runs a function on component mount
 *
 * @param fn The function to run, which may return a cleanup function
 */
export default function $mount(fn: () => Cleanup | void) {
	context.mountedFunctions.push(fn);
}
