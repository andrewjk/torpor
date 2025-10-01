import type SourceRange from "../SourceRange";
import type TemplateNode from "./TemplateNode";

export default interface TextNode extends TemplateNode {
	type: "text";
	content: string;
	//reactive: boolean;
	ranges: SourceRange[];
}
