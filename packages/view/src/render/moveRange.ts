import type Range from "../types/Range";
import isFragmentNode from "./isFragmentNode";

export default function moveRange(parent: Node, range: Range, before: ChildNode | null): void {
	const endNode = range.endNode || range.startNode;
	let currentNode = range.startNode;

	// HACK: The parent may have once been a document fragment, but will now be
	// in the document, so we will have to use the before element's parent,
	// which should work as long as we are always passing a before element...
	if (isFragmentNode(parent)) {
		parent = before!.parentNode!;
	}

	while (currentNode) {
		const nextNode = currentNode.nextSibling;
		parent.insertBefore(currentNode, before);
		if (currentNode === endNode) break;
		currentNode = nextNode;
	}
}
