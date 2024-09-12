import type Import from "../compile/types/Import";
import type Documentation from "../compile/types/docs/Documentation";
import type RootNode from "../compile/types/nodes/RootNode";
import type Style from "../compile/types/styles/Style";

/**
 * The template for a component, consisting of parts like script, markup and styles
 */
export default interface ComponentTemplate {
	name?: string;
	docs?: Documentation;
	imports?: Import[];
	script?: string;
	markup?: RootNode;
	childComponents?: ComponentTemplate[];
	style?: Style;
	styleHash?: string;
	props?: string[];
	contextProps?: string[];
}
