import context from "./context";

/**
 * Gets the first child of a node
 */
export default function nodeChild(parent: Node): Node {
	const child = parent.firstChild;
	if (context.hydrationNode) {
		context.hydrationNode = child;
	}
	// NOTE: We know this is not null as it is being called from generated code
	return child!;
}
