import Attribute from "./Attribute";
import Fragment from "./Fragment";
import Node from "./Node";
import ParentNode from "./ParentNode";

export default interface ElementNode extends ParentNode {
	type: "element" | "component" | "special";
	tagName: string;
	selfClosed?: boolean;
	attributes: Attribute[];
	children: Node[];

	// This gets set when building
	fragment?: Fragment;
	parentName?: string;
}
