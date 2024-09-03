import Attribute from "./Attribute";
import Fragment from "./Fragment";
import ParentNode from "./ParentNode";
import TemplateNode from "./TemplateNode";

export default interface ElementNode extends ParentNode {
	type: "element" | "component" | "special";
	tagName: string;
	selfClosed?: boolean;
	attributes: Attribute[];
	children: TemplateNode[];

	// This gets set when building
	fragment?: Fragment;
	parentName?: string;
}
