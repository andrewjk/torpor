import context from "../render/context";
import type Cleanup from "../types/Cleanup";

/**
 * Runs `fn` once after the component is mounted to the DOM. May return a
 * cleanup function that runs on unmount / region clear.
 *
 * The callback is **not reactive**: it runs exactly once per mount, and
 * reactive values it reads are not tracked. To set up something that should
 * keep updating, wrap the reactive part in `$run`:
 *
 * ```ts
 * $onmount(() => {
 * 	$run(() => {
 * 		label.textContent = $state.count > 0 ? "+" : "";
 * 	});
 * });
 * ```
 *
 * The element-level equivalent is the `onmount` attribute:
 * `<input onmount={(el) => el.focus()} />`.
 *
 * @param fn The function to run, which may return a cleanup function
 */
export default function $onmount(fn: () => Cleanup | void): void {
	context.mountEffects.push({
		region: context.activeRegion,
		fn,
	});
}
