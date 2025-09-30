import type Import from "../compile/types/Import";
import type ScriptChunk from "../compile/types/ScriptChunk";
import type TemplateComponent from "./TemplateComponent";

/**
 * The template for a component file, consisting of parts like script, markup and styles
 */
export default interface Template {
	imports: Import[];
	script: ScriptChunk[];
	components: TemplateComponent[];
}
