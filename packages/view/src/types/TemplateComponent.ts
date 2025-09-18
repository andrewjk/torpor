import type RootNode from "../compile/types/nodes/RootNode";
import type Style from "../compile/types/styles/Style";

export default interface TemplateComponent {
	start?: number;
	/** The component's name */
	name?: string;
	/** Whether the component is defined with a default function */
	default?: boolean;
	/** Params declared by the user in the component's function */
	params?: string;
	markup?: RootNode;
	head?: RootNode;
	style?: Style;
	/** $props that are used in the component's function */
	props?: string[];
	/** $context props that are used in the component's function */
	contextProps?: string[];
	needsContext?: boolean;
	/** $slot props that are used in the component's function */
	slotProps?: string[];
}
