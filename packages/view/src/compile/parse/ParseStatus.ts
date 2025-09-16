import { type CompileError } from "../types/CompileError";
import { type Import } from "../types/Import";
import { type ElementNode } from "../types/nodes/ElementNode";
import { type RootNode } from "../types/nodes/RootNode";
import { type Style } from "../types/styles/Style";

export type ParseStatus = {
	source: string;
	i: number;
	marker: number;
	level: number;

	imports: Import[];
	script: string;

	components: ParseComponentStatus[];

	errors: CompileError[];
};

export interface ParseComponentStatus {
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
	/** $slot props that are used in the component's function */
	slotProps?: string[];
}
