import type TemplateNode from "./TemplateNode";

export default interface CommentNode extends TemplateNode {
	type: "comment";
	commentType: "html" | "line" | "block";
	content: string;
}
