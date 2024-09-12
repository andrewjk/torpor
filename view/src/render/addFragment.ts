import context from "./context";

export default function addFragment(
	fragment: DocumentFragment,
	parent: ParentNode,
	before: Node | null,
) {
	//console.log(`adding fragment '${fragment.textContent}' to ${printNode(parent)}`);
	//console.log("before", printNode(before));

	// Set the active range's end node to the last node in the fragment
	const range = context.activeRange;
	if (range) {
		if (context.hydrationNode) {
			range.endNode = context.hydrationNode as ChildNode;
		} else {
			range.endNode = fragment.lastChild;
		}
	}

	if (!context.hydrationNode) {
		// HACK: We need to be able to add fragments to new fragments as well as
		// fragments that have already been added to the document. New fragments will
		// be ok, but fragments that have been added will not be parents of the before
		// element (because it's now in the document). In this case we will have to
		// use the before element's parent, which should work as long as we are always
		// passing a before element...
		if (parent.nodeType === 11) {
			parent = before!.parentNode!;
		}

		// Add the fragment
		parent.insertBefore(fragment, before);
	}
}
