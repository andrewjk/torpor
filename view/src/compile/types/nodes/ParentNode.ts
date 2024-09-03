import NodeType from "./NodeType";
import TemplateNode from "./TemplateNode";

export default interface ParentNode extends TemplateNode {
	type: NodeType;
	children: TemplateNode[];
}
