import NodeType from "./NodeType";

export default interface Node {
  type: NodeType;

  // This gets set when building
  // For element and text nodes, it is the name of the element that is created
  // For control nodes, it is the name of the anchor element
  varName?: string;
}
