import { type Range } from "../types/Range";

export default function moveRange(parent: Node, range: Range, before: ChildNode | null): void {
	const endNode = range.endNode || range.startNode;
	let currentNode = range.startNode;
	while (currentNode) {
		const nextNode = currentNode.nextSibling;
		parent.insertBefore(currentNode, before);
		if (currentNode === endNode) break;
		currentNode = nextNode;
	}
}
