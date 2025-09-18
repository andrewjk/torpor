import type Cleanup from "../types/Cleanup";
import context from "./context";

/**
 * Runs and re-runs a function on component mount
 *
 * @param fn The function to run, which may return a cleanup function
 */
export default function $mount(fn: () => Cleanup | void): void {
	context.mountEffects.push(fn);
}
