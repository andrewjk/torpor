import { isSpace } from "../../parse/parseUtils";
import type TemplateNode from "./TemplateNode";
import type TextNode from "./TextNode";
import isTextNode from "./isTextNode";

export default function isSpaceNode(node: TemplateNode): node is TextNode {
	return isTextNode(node) && isSpace(node.content);
}
