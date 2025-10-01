import type CompileError from "../types/CompileError";
import type Import from "../types/Import";
import type ScriptChunk from "../types/ScriptChunk";
import type ParseComponentStatus from "./ParseComponentStatus";

export default interface ParseStatus {
	source: string;
	i: number;
	marker: number;
	level: number;

	imports: Import[];
	script: ScriptChunk[];

	components: ParseComponentStatus[];

	errors: CompileError[];
}
