import type Range from "../types/Range";

export default function clearRange(range: Range): void {
	//console.log("clearing range", range.startNode, "to", range.endNode);

	// Clear child ranges and collect animations that take place within this
	// range and its children
	let animations: Animation[] | undefined =
		range.animations !== null ? Array.from(range.animations) : undefined;
	if (range.children > 0) {
		let childRange = range;
		for (let i = 0; i < range.children; i++) {
			childRange = childRange.nextRange!;
			if (childRange.animations !== null) {
				animations ??= [];
				animations.push(...childRange.animations);
			}
			releaseRange(childRange);
		}
		range.nextRange = childRange;
	}

	if (range.previousRange !== null) {
		range.previousRange.nextRange = range.nextRange;
	}
	if (range.nextRange !== null) {
		range.nextRange.previousRange = range.previousRange;
	}

	// Wait for animations, if any, then clear the range's nodes
	if (animations !== undefined) {
		// eslint-disable-next-line
		Promise.all(animations.map((a) => a.finished)).then(() => clearNodes(range));
	} else {
		clearNodes(range);
	}
}

function clearNodes(range: Range) {
	// Clear the nodes for this range
	if (range.startNode !== null && range.endNode !== null) {
		let currentNode = range.endNode;
		// DEBUG:
		//if (range.startNode.parentNode !== currentNode.parentNode) {
		//	throw new Error("range nodes have different parents");
		//}
		while (currentNode !== range.startNode) {
			let previousNode = currentNode.previousSibling;
			currentNode.remove();
			currentNode = previousNode!;
		}
		currentNode.remove();
	}
	releaseRange(range);
}

function releaseRange(range: Range) {
	range.startNode = null;
	range.endNode = null;
	range.previousRange = null;
	range.nextRange = null;
	range.animations = null;
}
