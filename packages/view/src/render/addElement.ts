import context from "./context";
import runMountSideEffects from "./runMountSideEffects";

/**
 * Companion to `addFragment` for the single-root-element codegen path. Wires
 * a cloned root element (produced by `getElementFragment`) into the live DOM
 * tree, sets the active region's start/end nodes, and runs the same
 * mount-time side effects as `addFragment` (`$mount` effects, stashed event
 * listeners, stashed animations).
 *
 * Differences from `addFragment`:
 * - `node` is both the start and end of the region (no
 *   `fragment.firstChild`/`fragment.lastChild` indirection).
 * - When hydrating, the existing DOM node is reused (the cloned `node` is
 *   discarded); `endNode` is still `node` because `nodeRootElement` returns
 *   the hydration cursor's node in that case, not the cloned one.
 *
 * @param node The root element (cloned by `getElementFragment`, or the
 *   hydration cursor's node when hydrating).
 * @param parent The intended parent element.
 * @param before The sibling to insert before (or `null` to append).
 */
export default function addElement(node: Element, parent: ParentNode, before: Node | null): void {
	const activeRegion = context.activeRegion;
	const hydrationNode = context.hydrationNode;

	// The single root element is both the start and the end of the region.
	// When hydrating, `node` is already the existing DOM node (returned by
	// `nodeRootElement`'s cursor walk), so this is correct in both branches.
	activeRegion.startNode = node;
	activeRegion.endNode = node;

	parent = before?.parentNode ?? parent;

	// Add the node
	if (hydrationNode === null) {
		parent.insertBefore(node, before);
	}

	// If we're adding this node to the DOM, we can now run any $mount
	// effects, add our stashed events and play our stashed animations
	runMountSideEffects(parent, activeRegion, hydrationNode);
}
