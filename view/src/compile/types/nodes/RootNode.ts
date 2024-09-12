import type Fragment from "./Fragment";
import type ParentNode from "./ParentNode";
import type TemplateNode from "./TemplateNode";

export default interface RootNode extends ParentNode {
	type: "root";
	children: TemplateNode[];

	// This gets set when building
	fragment?: Fragment;
}
