import context from "./context";
import runMountSideEffects from "./runMountSideEffects";

export default function addFragment(
	fragment: DocumentFragment,
	parent: ParentNode,
	before: Node | null,
	endNode?: ChildNode,
	startNode?: ChildNode,
): void {
	//console.log(`adding fragment '${fragment.textContent}' to `, parent);
	//console.log("before", before);

	const activeRegion = context.activeRegion;
	const hydrationNode = context.hydrationNode;

	// Set the active region's start/end nodes to the first and last nodes in
	// the fragment. During hydration, child component rendering (via
	// `addElement`) may have overwritten these — the `startNode` parameter
	// (the root node) restores the correct bounds. But when the root node was
	// a hydration start marker, `nodeAnchor` will have removed it from the
	// DOM and set the region's start node to the first node inside the block
	// — restoring the removed marker here would leave the region with a
	// detached start node (which breaks clearing the region later).
	if (hydrationNode !== null) {
		if (startNode !== undefined && startNode.parentNode !== null) {
			activeRegion.startNode = startNode;
		}
		activeRegion.endNode = endNode ?? hydrationNode;
	} else {
		activeRegion.startNode = fragment.firstChild;
		activeRegion.endNode = fragment.lastChild;
	}

	parent = before?.parentNode ?? parent;

	// Add the fragment
	if (hydrationNode === null) {
		parent.insertBefore(fragment, before);
	}

	// If we're adding this fragment to the DOM, we can now run any $onmount
	// effects, add our stashed events and play our stashed animations
	runMountSideEffects(parent, activeRegion, hydrationNode);
}
