import Fragment from "./Fragment";
import OperationType from "./OperationType";
import ParentNode from "./ParentNode";
import TemplateNode from "./TemplateNode";

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
