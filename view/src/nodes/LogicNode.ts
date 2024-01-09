import Node from "./Node";

export default interface LogicNode extends Node {
  type: "logic";
  operation: string;
  logic: string;
  children: Node[];
}
