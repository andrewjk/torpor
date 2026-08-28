import type TemplateComponent from "../../types/TemplateComponent";
import type CompileError from "../types/CompileError";
import type Import from "../types/Import";
import type ScriptChunk from "../types/ScriptChunk";
import ElementNode from "../types/nodes/ElementNode";

export default interface ParseStatus {
	source: string;
	i: number;
	marker: number;
	level: number;

	/**
	 * One entry per open brace, parallel to `level`: true when the brace was
	 * opened by a component function (so its matching close ends the
	 * component), false when it was opened by other top-level script (an
	 * interface, type or object literal — its close must not end the
	 * component).
	 */
	braces: boolean[];

	imports: Import[];
	script: ScriptChunk[];

	components: TemplateComponent[];
	stack: ElementNode[];

	errors: CompileError[];
}
