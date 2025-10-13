import type RootNode from "../compile/types/nodes/RootNode";
import type Style from "../compile/types/styles/Style";

export default interface TemplateComponent {
	start?: number;
	/** The component's name */
	name?: string;
	/** Whether the component is exported from the file */
	exported?: boolean;
	/** Whether the component is defined with a default function */
	default?: boolean;
	/** The component's documentation comments */
	documentation?: string;
	/** Params declared by the user in the component's function */
	params?: string;
	markup?: RootNode;
	head?: RootNode;
	style?: Style;
	/** The type or interface that is used for the $props param */
	propsType?: string;
	/** $props that are used in the component's function */
	props?: string[];
	/** $context props that are used in the component's function */
	contextProps?: string[];
	/** $slot props that are used in the component's function */
	slotProps?: string[];
}
