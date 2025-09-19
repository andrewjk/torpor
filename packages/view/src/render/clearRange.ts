import type Range from "../types/Range";

export default function clearRange(range: Range): void {
	//console.log("clearing range", range.startNode, "to", range.endNode);

	// Clear child ranges and collect animations that take place within this
	// range and its children
	let animations: Animation[] = [];
	clearChildren(range, animations);

	// Wait for animations, if any, then clear the range's nodes
	if (animations.length > 0) {
		// eslint-disable-next-line
		Promise.all(animations.map((a) => a.finished)).then(() => clearNodes(range));
	} else {
		clearNodes(range);
	}
}

function clearChildren(range: Range, animations: Animation[]) {
	// Collect any running animations, including ones from the effect cleanups
	if (range.animations !== null) {
		for (let animation of range.animations) {
			animations.push(animation);
		}
	}

	// Recurse through the children
	if (range.children !== null) {
		for (let child of range.children) {
			clearChildren(child, animations);

			// Release the nodes
			child.startNode = null;
			child.endNode = null;
			child.children = null;
			child.animations = null;
		}
	}
}

function clearNodes(range: Range) {
	// Clear the nodes for this range
	if (range.startNode !== null) {
		let currentNode = range.endNode ?? range.startNode;
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
		range.children = null;
		range.animations = null;
	}
}
