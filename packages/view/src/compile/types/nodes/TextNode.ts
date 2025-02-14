import { type TemplateNode } from "./TemplateNode";

export type TextNode = TemplateNode & {
	type: "text";
	content: string;
	//reactive: boolean;
};
