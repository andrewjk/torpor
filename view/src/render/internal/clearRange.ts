import type Range from "../../global/types/Range";
import removeRangeEffects from "../../watch/internal/removeRangeEffects";

export default function clearRange(range: Range) {
	//console.log(`clearing range ${printNode(range.startNode)} to ${printNode(range.endNode)}`);

	// Clear the nodes for this range
	if (range.startNode) {
		let currentNode = range.endNode || range.startNode;
		// DEBUG:
		//if (range.startNode.parentNode !== currentNode.parentNode) {
		//	throw new Error("range nodes have different parents");
		//}
		while (currentNode !== range.startNode) {
			let nextNode = currentNode.previousSibling;
			currentNode.remove();
			currentNode = nextNode!;
		}
		currentNode.remove();

		// Release the nodes
		range.startNode = null;
		range.endNode = null;
	}

	// Clear any effects that take place within this range and its children
	removeRangeEffects(range);
}
