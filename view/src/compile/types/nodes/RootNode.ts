import Fragment from "./Fragment";
import ParentNode from "./ParentNode";
import TemplateNode from "./TemplateNode";

export default interface RootNode extends ParentNode {
	type: "root";
	children: TemplateNode[];

	// This gets set when building
	fragment?: Fragment;
}
