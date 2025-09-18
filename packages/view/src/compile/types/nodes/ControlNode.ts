import type Fragment from "./Fragment";
import type OperationType from "./OperationType";
import type ParentNode from "./ParentNode";
import type TemplateNode from "./TemplateNode";

export default interface ControlNode extends ParentNode {
	type: "control";
	operation: OperationType;
	statement: string;
	children: TemplateNode[];

	singleRooted?: boolean;

	// This gets set when building
	fragment?: Fragment;
	parentName?: string;
}
