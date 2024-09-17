import context from "./context";

/**
 * Gets the first child in a fragment
 * */
export default function nodeRoot(parent: ParentNode) {
	const hydrationNode = context.hydrationNode;
	if (hydrationNode) {
		// If hydrating, set the active range's start node, while we have it
		const range = context.activeRange;
		if (range && !range.startNode) {
			range.startNode = hydrationNode as ChildNode;
		}
		return hydrationNode;
	} else {
		return parent.firstChild;
	}
}
