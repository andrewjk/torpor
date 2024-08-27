import type ElementNode from "../../types/nodes/ElementNode";
import slottifyChildNodes from "./slottifyChildNodes";

export default function wrangleSpecialNode(node: ElementNode) {
	if (node.tagName === ":slot") {
		// HACK: Add a :fill node underneath :slot nodes for their fallback content
		// Anchors will be created for :slot nodes and fragments will be created for the :fill content
		slottifyChildNodes(node);
	}
}
