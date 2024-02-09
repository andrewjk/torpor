import Node from "./Node";

export default interface ControlNode extends Node {
  type: "control";
  operation: string;
  statement: string;
  children: Node[];
}
