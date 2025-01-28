import { type Fragment } from "./Fragment";
import { type ParentNode } from "./ParentNode";
import { type TemplateNode } from "./TemplateNode";

export type RootNode = ParentNode & {
	type: "root";
	children: TemplateNode[];

	// This gets set when building
	fragment?: Fragment;
};
