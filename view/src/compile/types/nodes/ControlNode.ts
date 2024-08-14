import Fragment from "./Fragment";
import Node from "./Node";
import OperationType from "./OperationType";
import ParentNode from "./ParentNode";

export default interface ControlNode extends ParentNode {
  type: "control";
  operation: OperationType;
  statement: string;
  children: Node[];

  singleRooted?: boolean;

  // This gets set when building
  fragment?: Fragment;
  parentName?: string;
}
