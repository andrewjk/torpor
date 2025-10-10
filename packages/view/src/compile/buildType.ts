import type BuildOptions from "../types/BuildOptions";
import type Template from "../types/Template";
import Builder from "./utils/Builder";

/**
 * Builds a component template into a d.ts file
 *
 * @param name The name of the component
 * @param template The component template, possibly including script, markup and styles
 *
 * @returns The d.ts file content
 */
export default function buildType(template: Template, options?: BuildOptions): string {
	let b = new Builder();

	b.append(`import { type SlotRender } from "${options?.renderFolder || "@torpor/view"}";`);

	for (let component of template.components) {
		if (component.exported) {
			b.append("");
			if (component.propsType) {
				b.append(component.propsType);
				b.append("");
			}
			b.append(`
			${component.documentation ?? ""}
			${component.default ? "declare" : "export declare"} function ${component.name}(
				$parent: ParentNode,
				$anchor: Node | null,
				${component.params || "$props?: Record<PropertyKey, any>"},
				$context?: Record<PropertyKey, any>,
				$slots?: Record<string, SlotRender>,
			): void;
		`);
			if (component.default) {
				b.append(`export default ${component.name};`);
			}
		}
	}

	return b.toString();
}
