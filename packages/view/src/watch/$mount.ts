import context from "../render/context";
import type Cleanup from "../types/Cleanup";

/**
 * Runs `fn` once after the component is mounted to the DOM. May return a
 * cleanup function that runs on unmount / region clear.
 *
 * Although `$mount` is implemented as a `$run`, the mount callback is
 * guaranteed to fire at most once per DOM mount: the keyed-list reconciler's
 * no-proxy force-rerun path (`rerunRegionEffects`) explicitly skips mount
 * effects. Reactive re-runs therefore only happen via the normal signal path
 * — if `fn` reads proxied state, it will re-run when those signals change,
 * but it will never re-fire as a side effect of a list-item update.
 *
 * @param fn The function to run, which may return a cleanup function
 */
export default function $mount(fn: () => Cleanup | void): void {
	context.mountEffects.push(fn);
}
