import type Import from "../compile/types/Import";
import TemplateComponent from "./TemplateComponent";

/**
 * The template for a component file, consisting of parts like script, markup and styles
 */
export default interface Template {
	imports: Import[];
	script: string;
	components: TemplateComponent[];
}
