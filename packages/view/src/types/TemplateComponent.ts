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
	/** Type parameters declared by the user in the component's function, e.g. `<Data = any>` */
	typeParams?: string;
	markup?: RootNode;
	/** The markup of the component's top-level `@error` block, if any */
	error?: RootNode;
	/** The variable name bound to the error in the `@error` block */
	errorVar?: string;
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
