import context from "./context";

/**
 * Gets the anchor node after adding a fragment.
 *
 * When hydrating, the anchor node initially gets set to the first node in the
 * statement, and then we work through the nodes until we get to the anchor node
 * itself. So, after hydrating, we need to set the anchor node to the actual
 * anchor node, from the current hydration node.
 *
 * I'm not sure this is going to always be the case...
 *
 * @param node The anchor node.
 * @returns The (maybe new) anchor node.
 */
export default function nodeReanchor(node: ChildNode): ChildNode {
	return context.hydrationNode ?? node;
}
