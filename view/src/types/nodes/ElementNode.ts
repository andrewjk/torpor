import Attribute from "./Attribute";
import Node from "./Node";

export default interface ElementNode extends Node {
  type: "element" | "component" | "special";
  tagName: string;
  selfClosed?: boolean;
  attributes: Attribute[];
  children: Node[];
}
