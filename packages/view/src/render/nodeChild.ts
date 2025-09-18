import context from "./context";

/**
 * Gets the first child of a node.
 *
 * Sets the hydration node.
 *
 * @param parent The parent node.
 */
export default function nodeChild(parent: Node): ChildNode {
	let childNode = parent.firstChild;
	if (context.hydrationNode !== null) {
		// The child may be null when hydrating the sole text child of an
		// element with no text
		if (childNode === null) {
			childNode = parent.appendChild(parent.ownerDocument!.createTextNode(""));
		}
		context.hydrationNode = childNode;
	}

	// NOTE: We know this is not null as it is being called from generated code
	return childNode!;
}
