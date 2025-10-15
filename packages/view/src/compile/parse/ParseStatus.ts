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

	imports: Import[];
	script: ScriptChunk[];

	components: TemplateComponent[];
	stack: ElementNode[];

	errors: CompileError[];
}
