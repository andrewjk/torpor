import type Region from "../types/Region";

export default function moveRegion(parent: Node, region: Region, before: ChildNode | null): void {
	parent = before?.parentNode ?? parent;
	const endNode = region.endNode ?? region.startNode;
	let currentNode = region.startNode;

	while (currentNode !== null) {
		const nextNode = currentNode.nextSibling;
		parent.insertBefore(currentNode, before);
		if (currentNode === endNode) break;
		currentNode = nextNode;
	}
}
