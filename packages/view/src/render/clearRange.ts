import { type Range } from "../types/Range";

export default function clearRange(range: Range): void {
	//console.log("clearing range", range.startNode, "to", range.endNode);

	// Clear effects and collect animations that take place within this range and its children
	let animations: Animation[] = [];
	clearEffects(range, animations);

	// Wait for animations, if any, then clear the range's nodes
	if (animations.length) {
		// eslint-disable-next-line
		Promise.all(animations.map((a) => a.finished)).then(() => clearNodes(range));
	} else {
		clearNodes(range);
	}
}

function clearEffects(range: Range, animations: Animation[]) {
	// Collect any running animations, including ones from the effect cleanups
	if (range.animations) {
		for (let animation of range.animations) {
			animations.push(animation);
		}
	}

	// Recurse through the children
	if (range.children) {
		for (let child of range.children) {
			clearEffects(child, animations);
		}
		range.children.length = 0;
	}
}

function clearNodes(range: Range) {
	// Clear the nodes for this range
	if (range.startNode) {
		let currentNode = range.endNode || range.startNode;
		// DEBUG:
		if (range.startNode.parentNode !== currentNode.parentNode) {
			throw new Error("range nodes have different parents");
		}
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
}
