import context from "../../global/context";
import { HYDRATION_END, HYDRATION_START } from "./hydrationMarkers";
import isComment from "./isComment";
import nodeNext from "./nodeNext";

export default function findAnchor(node: ChildNode) {
	// If we are hydrating, the anchor will be at the end of the paired <![> and
	// <!]> comments
	if (context.hydrationNode && isComment(node) && node.data === HYDRATION_START) {
		// Skip and remove the start node
		let currentNode = nodeNext(node);
		node.remove();

		// Go through siblings until we get to the end
		let level = 1;
		while (currentNode) {
			if (isComment(currentNode)) {
				if (currentNode.data === HYDRATION_START) {
					level += 1;
				} else if (currentNode.data === HYDRATION_END) {
					level -= 1;
				}
				if (level === 0) {
					// Remove the end node and return the next one
					const endNode = currentNode.nextSibling;
					currentNode.remove();
					return endNode;
				}
			}
			currentNode = currentNode.nextSibling;
		}

		if (!currentNode) {
			throw new Error("End hydration comment not found");
		}
	}

	return node;
}
