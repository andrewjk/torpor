import context from "../global/context";
import type Cleanup from "../global/types/Cleanup";

/**
 * Runs and re-runs a function on component mount
 * @param fn The function to run
 */
export default function $mount(fn: () => Cleanup | void) {
  context.mountedFunctions.push(fn);
}
