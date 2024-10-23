import type CompileError from "../types/CompileError";
import type Import from "../types/Import";
import type ElementNode from "../types/nodes/ElementNode";
import type Style from "../types/styles/Style";

export default interface ParseStatus {
	name: string;
	source: string;
	i: number;
	marker: number;
	level: number;

	imports: Import[];
	script: string;

	components: ParseComponentStatus[];
	current: ParseComponentStatus;

	errors: CompileError[];
}

interface ParseComponentStatus {
	start?: number;
	params?: string;
	markup?: ElementNode;
	style?: Style;
	styleHash?: string;
	props?: string[];
	contextProps?: string[];
}
