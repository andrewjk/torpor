import type Range from "../types/Range";

export default function clearRange(range: Range): void {
	//console.log("clearing range", range.startNode, "to", range.endNode);

	// Clear child ranges and collect animations that take place within this
	// range and its children
	let animations: Animation[] = range.animations !== null ? Array.from(range.animations) : [];
	if (range.children > 0) {
		let nextRange = range.nextRange!;
		for (let i = 1; i < range.children; i++) {
			if (nextRange.animations !== null) {
				for (let animation of nextRange.animations) {
					animations.push(animation);
				}
			}
			let nr = nextRange.nextRange!;
			releaseRange(nextRange);
			nextRange = nr;
		}
		range.nextRange = nextRange;
	}

	if (range.previousRange !== null) {
		range.previousRange.nextRange = range.nextRange;
		if (range.previousRange.lastRange === range) {
			range.previousRange.lastRange = range.nextRange;
		}
	}
	if (range.nextRange !== null) {
		range.nextRange.previousRange = range.previousRange;
	}

	// Wait for animations, if any, then clear the range's nodes
	if (animations.length > 0) {
		// eslint-disable-next-line
		Promise.all(animations.map((a) => a.finished)).then(() => clearNodes(range));
	} else {
		clearNodes(range);
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
	}
	releaseRange(range);
}

function releaseRange(range: Range) {
	range.startNode = null;
	range.endNode = null;
	range.previousRange = null;
	range.nextRange = null;
	range.lastRange = null;
	range.animations = null;
}
