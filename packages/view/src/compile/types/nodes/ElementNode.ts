import type Attribute from "./Attribute";
import type Fragment from "./Fragment";
import type ParentNode from "./ParentNode";
import type TemplateNode from "./TemplateNode";

export default interface ElementNode extends ParentNode {
	type: "element" | "component" | "special";
	tagName: string;
	closed?: boolean;
	selfClosed?: boolean;
	attributes: Attribute[];
	children: TemplateNode[];

	// This gets set when building
	fragment?: Fragment;
	parentName?: string;

	// For <fill> only -- maybe we should make a SpecialNode type?
	hasSlotProps?: boolean;
}
