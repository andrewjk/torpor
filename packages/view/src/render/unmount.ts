import type Region from "../types/Region";
import clearRegion from "./clearRegion";
import context from "./context";

/**
 * Tears down the current UI: disposes the root region tree (running effect
 * cleanups and detaching subscriptions), resets the render context, and
 * removes any remaining child nodes from `parent`.
 *
 * Call this before `mount`ing a fresh component tree into the same container
 * (e.g. when client-side navigating to a route whose layout chain differs
 * from the previous one). `mount` refuses to mount into a non-empty parent
 * and reuses an existing root region, so both must be cleared first.
 *
 * @param parent The container that the previous UI was mounted into
 */
export default function unmount(parent: ParentNode): void {
	if (context.rootRegion !== null) {
		clearRegion(context.rootRegion);
		context.rootRegion = null as unknown as Region;
		context.previousRegion = null as unknown as Region;
		context.activeRegion = null as unknown as Region;
	}

	// The root region has no start/end markers of its own, so `clearRegion`
	// disposes its descendants' effects but leaves their DOM nodes behind.
	// Remove them so `mount` finds an empty container.
	while (parent.firstChild !== null) {
		parent.firstChild.remove();
	}
}
