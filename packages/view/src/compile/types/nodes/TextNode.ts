import type SourceSpan from "../SourceSpan";
import type TemplateNode from "./TemplateNode";

export default interface TextNode extends TemplateNode {
	type: "text";
	content: string;
	//reactive: boolean;
	spans: SourceSpan[];
}
