import context from "../../global/context";

/**
 * Gets the first child in a fragment
 * */
export default function nodeRoot(parent: ParentNode) {
	if (context.hydrationNode) {
		// If hydrating, set the active range's start node, as it won't have been done in
		// getFragment
		if (context.activeRange && !context.activeRange.startNode) {
			context.activeRange.startNode = context.hydrationNode as ChildNode;
		}
		return context.hydrationNode;
	} else {
		return parent.firstChild;
	}
}
