import type ScriptChunk from "../compile/types/ScriptChunk";
import type TemplateComponent from "./TemplateComponent";

/**
 * The template for a component file, consisting of parts like script, markup and styles
 */
export default interface Template {
	script: ScriptChunk[];
	components: TemplateComponent[];
}
