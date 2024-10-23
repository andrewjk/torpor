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
	name?: string;
	start?: number;
	params?: string;
	markup?: ElementNode;
	style?: Style;
	props?: string[];
	contextProps?: string[];
}
