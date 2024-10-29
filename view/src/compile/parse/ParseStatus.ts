import type CompileError from "../types/CompileError";
import type Import from "../types/Import";
import type ElementNode from "../types/nodes/ElementNode";
import type Style from "../types/styles/Style";

export default interface ParseStatus {
	source: string;
	i: number;
	marker: number;
	level: number;

	imports: Import[];
	script: string;

	components: ParseComponentStatus[];

	errors: CompileError[];
}

export interface ParseComponentStatus {
	start?: number;
	name?: string;
	default?: boolean;
	params?: string;
	markup?: ElementNode;
	stack?: ElementNode[];
	style?: Style;
	props?: string[];
	contextProps?: string[];
}
