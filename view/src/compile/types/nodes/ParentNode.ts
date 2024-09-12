import type NodeType from "./NodeType";
import type TemplateNode from "./TemplateNode";

export default interface ParentNode extends TemplateNode {
	type: NodeType;
	children: TemplateNode[];
}
