import type ElementNode from "../types/nodes/ElementNode";
import type RootNode from "../types/nodes/RootNode";
import type Style from "../types/styles/Style";

export default interface ParseComponentStatus {
	start?: number;
	/** The component's name */
	name?: string;
	/** Whether the component is defined in a default function */
	default?: boolean;
	/** Params declared by the user in the component's function */
	params?: string;
	markup?: RootNode;
	head?: RootNode;
	stack?: ElementNode[];
	style?: Style;
	/** $props that are used in the component's function */
	props?: string[];
	/** $context props that are used in the component's function */
	contextProps?: string[];
	needsContext?: boolean;
	/** $slot props that are used in the component's function */
	slotProps?: string[];
}
