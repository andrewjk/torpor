import { type ControlNode } from "../types/nodes/ControlNode";
import { type ElementNode } from "../types/nodes/ElementNode";
import { type TextNode } from "../types/nodes/TextNode";
import isTextNode from "../types/nodes/isTextNode";
import { type ParseStatus } from "./ParseStatus";
import consumeSpace from "./utils/consumeSpace";

export default function addSpaceElement(parent: ElementNode | ControlNode, status: ParseStatus) {
	const content = consumeSpace(status);
	if (content) {
		const previousNode = parent.children[parent.children.length - 1];
		if (previousNode && isTextNode(previousNode)) {
			previousNode.content += content;
		} else {
			const space: TextNode = {
				type: "text",
				content,
			};
			parent.children.push(space);
		}
	}
}
