import Fragment from "./Fragment";
import Node from "./Node";
import OperationType from "./OperationType";
import ParentNode from "./ParentNode";

export default interface RootNode extends ParentNode {
  type: "root";
  children: Node[];

  // This gets set when building
  fragment?: Fragment;
}
