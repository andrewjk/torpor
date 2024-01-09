import Attribute from "../types/Attribute";
import Node from "./Node";

export default interface ElementNode extends Node {
  type: "element";
  tagName: string;
  selfClosed?: boolean;
  attributes: Attribute[];
  children: Node[];
}
