import type RootNode from "../compile/types/nodes/RootNode";
import type Style from "../compile/types/styles/Style";

export default interface TemplateComponent {
	params?: string;
	markup?: RootNode;
	style?: Style;
	styleHash?: string;
	props?: string[];
	contextProps?: string[];
}
