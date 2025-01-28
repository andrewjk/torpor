import { type RootNode } from "../compile/types/nodes/RootNode";
import { type Style } from "../compile/types/styles/Style";

export type TemplateComponent = {
	start?: number;
	name?: string;
	default?: boolean;
	params?: string;
	markup?: RootNode;
	style?: Style;
	props?: string[];
	contextProps?: string[];
};
