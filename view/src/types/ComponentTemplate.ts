import type Import from "../compile/types/Import";
import type RootNode from "../compile/types/nodes/RootNode";
import type Style from "../compile/types/styles/Style";

/**
 * The template for a component, consisting of parts like script, markup and styles
 */
export default interface ComponentTemplate {
	name?: string;
	imports?: Import[];
	script?: string;
	params?: string;
	markup?: RootNode;
	childComponents?: ComponentTemplate[];
	style?: Style;
	styleHash?: string;
	props?: string[];
	contextProps?: string[];
}
