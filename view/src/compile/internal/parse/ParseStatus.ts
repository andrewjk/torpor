import type CompileError from "../../types/CompileError";
import type ComponentTemplate from "../../types/ComponentTemplate";
import type Import from "../../types/Import";
import type Documentation from "../../types/docs/Documentation";
import type ElementNode from "../../types/nodes/ElementNode";
import type Style from "../../types/styles/Style";

export default interface ParseStatus {
	source: string;
	// The current index
	i: number;
	docs?: Documentation;
	script?: string;
	template?: ElementNode;
	childTemplates?: ComponentTemplate[];
	style?: Style;
	styleHash?: string;
	imports?: Import[];
	// Errors that have been encountered
	errors: CompileError[];
}
