import type BuildOptions from "../types/BuildOptions";
import type ComponentTemplate from "../types/ComponentTemplate";
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
	template: ComponentTemplate,
	options?: BuildOptions,
): string {
	let b = new Builder();

	b.append(`import type { SlotRender } from "${options?.renderFolder || "@tera/view"}";`);
	b.append("");

	if (template.docs?.description) {
		b.append(`
		/**
		 * ${template.docs.description}
		 */`);
	}

	let propsInterface = "Record<PropertyKey, any>";
	if (template.docs?.props) {
		propsInterface = `{
			${template.docs.props.map((p) => `${p.description ? `/** ${p.description} */` + "\n" : ""}${p.name}${p.optional ? "?" : ""}: ${p.type};`).join("\n")}
		}`;
	}

	b.append(`
	declare namespace ${name} {
		/**
		 * The component's name.
		 */
		const name: "${name}";
		/**
		 * Mounts or hydrates the component into the supplied parent node.
		 * @param $parent -- The parent node.
		 * @param $anchor -- The node to mount the component before.
		 * @param $props -- The values that have been passed into the component as properties.
		 * @param $context -- Values that have been passed into the component from its ancestors.
		 * @param $slots -- Functions for rendering children into slot nodes within the component.
		 */
		const render: ($parent: ParentNode, $anchor: Node | null, $props?: ${propsInterface}, $context?: Record<PropertyKey, any>, $slots?: Record<string, SlotRender>) => void;
	}
		
	export default ${name};`);

	return b.toString();
}
