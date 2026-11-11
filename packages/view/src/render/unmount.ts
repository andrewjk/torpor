import type Region from "../types/Region";
import clearRegion from "./clearRegion";
import context from "./context";
import { containedTrees, registeredRegionTree, unregisterRegionTree } from "./regionTreeRegistry";

/**
 * Tears down the component tree that was mounted/hydrated into `parent`:
 * disposes its region tree (running effect cleanups and detaching
 * subscriptions), removes any remaining child nodes from `parent`, and —
 * when `parent` holds the root tree — resets the render context.
 *
 * When `parent` holds a nested tree (an embed inside a live page), only the
 * embed is disposed and the host's render context is left untouched. Any
 * embeds living inside a root container are disposed along with it.
 *
 * Call this before `mount`ing a fresh component tree into the same container
 * (e.g. when client-side navigating to a route whose layout chain differs
 * from the previous one). `mount` refuses to mount into a non-empty parent
 * and expects no leftover tree, so both must be cleared first.
 *
 * @param parent The container that the previous UI was mounted into
 */
export default function unmount(parent: ParentNode): void {
	const owned = registeredRegionTree(parent);

	// Embeds living inside this container would otherwise leak: their region
	// trees are deliberately not part of the container's own tree, and their
	// DOM goes away with it. Dispose them (and their DOM) first, while the
	// container is still connected.
	for (const [nestedParent, nestedTree] of containedTrees(parent)) {
		clearRegion(nestedTree);
		unregisterRegionTree(nestedParent);
	}

	if (owned !== undefined && owned !== context.rootRegion) {
		// A nested tree: dispose it and leave the surrounding render context
		// — the host's — untouched.
		clearRegion(owned);
		unregisterRegionTree(parent);
	} else {
		if (context.rootRegion !== null) {
			clearRegion(context.rootRegion);
			context.rootRegion = null as unknown as Region;
			context.previousRegion = null as unknown as Region;
			context.activeRegion = null as unknown as Region;
		}
		if (owned !== undefined) {
			unregisterRegionTree(parent);
		}
	}

	// The root region has no start/end markers of its own, so `clearRegion`
	// disposes its descendants' effects but leaves their DOM nodes behind.
	// Remove them so `mount` finds an empty container.
	while (parent.firstChild !== null) {
		parent.firstChild.remove();
	}
}
