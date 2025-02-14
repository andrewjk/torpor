import context from "./context";

/**
 * Gets the first child in a fragment
 * */
export default function nodeRoot(parent: Node): Node {
	const hydrationNode = context.hydrationNode;
	if (hydrationNode) {
		// If hydrating, set the active range's start node, while we have it
		const range = context.activeRange;
		if (range && !range.startNode) {
			range.startNode = hydrationNode;
		}
		return hydrationNode;
	} else {
		// NOTE: We know this is not null as it is being called from generated code
		return parent.firstChild!;
	}
}
