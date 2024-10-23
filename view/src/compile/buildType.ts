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
export default function buildType(
	name: string,
	template: Template,
	options?: BuildOptions,
): string {
	let b = new Builder();

	b.append(`import type { SlotRender } from "${options?.renderFolder || "@tera/view"}";`);

	for (let component of template.components) {
		b.append("");
		b.append(`
			/**
			 * Mounts or hydrates the component into the supplied parent node.
			 * @param $parent -- The parent node.
			 * @param $anchor -- The node to mount the component before.
			 * @param $props -- The values that have been passed into the component as properties.
			 * @param $context -- Values that have been passed into the component from its ancestors.
			 * @param $slots -- Functions for rendering children into slot nodes within the component.
			 */
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

	return b.toString();
}
