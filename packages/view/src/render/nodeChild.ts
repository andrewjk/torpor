import context from "./context";

/**
 * Gets the first child of a node
 */
export default function nodeChild(parent: Node): Node {
	let child = parent.firstChild;
	if (context.hydrationNode) {
		// The child may be null when hydrating the sole text child of an
		// element with no text
		if (!child) {
			child = parent.appendChild(parent.ownerDocument!.createTextNode(""));
		}
		context.hydrationNode = child;
	}
	// NOTE: We know this is not null as it is being called from generated code
	return child!;
}
