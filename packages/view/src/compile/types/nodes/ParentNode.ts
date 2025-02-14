import { type NodeType } from "./NodeType";
import { type TemplateNode } from "./TemplateNode";

export type ParentNode = TemplateNode & {
	type: NodeType;
	children: TemplateNode[];
};
