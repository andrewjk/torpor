import { isSpace } from "../../internal/parse/parseUtils";
import TemplateNode from "./TemplateNode";
import TextNode from "./TextNode";
import isTextNode from "./isTextNode";

export default function isSpaceNode(node: TemplateNode): node is TextNode {
	return isTextNode(node) && isSpace(node.content);
}
