import type Import from "../compile/types/Import";
import type RequirementDeclaration from "../compile/types/RequirementDeclaration";
import type ScriptChunk from "../compile/types/ScriptChunk";
import type TemplateComponent from "./TemplateComponent";

/**
 * The template for a component file, consisting of parts like script, markup and styles
 */
export default interface Template {
	imports: Import[];
	script: ScriptChunk[];
	components: TemplateComponent[];
	/** File-level `data` declarations (restricted-mode requirements). */
	requirements?: RequirementDeclaration[];
}
