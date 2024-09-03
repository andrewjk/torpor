import NodeType from "./NodeType";

export default interface TemplateNode {
	type: NodeType;

	// This gets set when building
	// For element and text nodes, it is the name of the element that is created
	// For control nodes, it is the name of the anchor element
	varName?: string;

	// This gets set when building
	// Nodes with anchors need to be hydrated immediately (while we have the
	// correct anchor node) rather than at the end of the fragment
	handled?: boolean;
}
