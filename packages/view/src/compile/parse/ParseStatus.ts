import type CompileError from "../types/CompileError";
import type Import from "../types/Import";
import type ParseComponentStatus from "./ParseComponentStatus";

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
