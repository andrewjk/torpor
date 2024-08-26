import Node from "./Node";
import NodeType from "./NodeType";

export default interface ParentNode extends Node {
	type: NodeType;
	children: Node[];
}
