import TemplateNode from "./TemplateNode";

export default interface TextNode extends TemplateNode {
	type: "text";
	content: string;
	//reactive: boolean;
}
