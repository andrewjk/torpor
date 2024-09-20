import type BuildOptions from "../../../types/BuildOptions";
import type ComponentTemplate from "../../../types/ComponentTemplate";
import Builder from "../../utils/Builder";
import buildServerNode from "./buildServerNode";

export default function buildServerCode(
	name: string,
	template: ComponentTemplate,
	options?: BuildOptions,
): string {
	let b = new Builder();

	// Gather imports as we go so they can be placed at the top
	let imports = new Set<string>();
	imports.add(`import type SlotRender from "\${folder}";`);

	// Build the component and any child components
	buildServerTemplate(name, template, imports, b, options);
	if (template.childComponents) {
		for (let child of template.childComponents) {
			buildServerTemplate(child.name || "ChildComponent", child, imports, b, options);
		}
	}

	// Add the gathered imports
	if (imports.size) {
		b.prepend("");
		for (let imp of Array.from(imports).reverse()) {
			b.prepend(imp.replace("${folder}", options?.renderFolder || "@tera/view"));
		}
	}

	// Export the component
	b.append(`export default ${name};`);

	return b.toString();
}

function buildServerTemplate(
	name: string,
	template: ComponentTemplate,
	imports: Set<string>,
	b: Builder,
	options?: BuildOptions,
) {
	if (template.imports) {
		// TODO: Should probably consolidate imports e.g. when we've split them up
		for (let imp of template.imports) {
			const alias = imp.alias ? ` as ${imp.alias}` : "";
			const name = imp.nonDefault ? `{ ${imp.name}${alias} }` : imp.name;
			imports.add(`import ${name} from '${imp.path}';`);
		}
	}

	if (template.docs?.description) {
		b.append(`
		/**
		 * ${template.docs.description}
		 */`);
	}

	let propsInterface = "any";
	if (template.docs?.props) {
		propsInterface = `{
			${template.docs.props.map((p) => `${p.description ? `/** ${p.description} */` + "\n" : ""}${p.name}: ${p.type};`).join("\n")}
		}`;
	}

	b.append(`
	const ${name} = {
		/**
		 * The component's name.
		 */
		name: "${name}",
		/**
		 * Renders the component into a HTML string.
		 * @param $props -- The values that have been passed into the component as properties.
		 * @param $context -- Values that have been passed into the component from its ancestors.
		 * @param $slots -- Functions for rendering children into slot nodes within the component.
		 */
		render: ($props: ${propsInterface}, $context: Record<PropertyKey, any>, $slots: Record<string, SlotRender>) => {`);

	// Make sure we've got $props if we're going to be using it
	if (template.props?.length) {
		b.append(`$props ||= {};`);
		b.append("");
	}

	// Redefine $context so that any newly added properties will only be passed to children
	if (template.contextProps?.length) {
		b.append(`$context = Object.assign({}, $context);`);
		b.append("");
	}

	if (template.script) {
		b.append("/* User script */");

		// HACK: Stub reactivity functions to do nothing on the server
		if (/\$watch\b/.test(template.script)) b.append("const $watch = (obj) => obj;");
		if (/\$unwrap\b/.test(template.script)) b.append("const $unwrap = (obj) => obj;");
		if (/\$run\b/.test(template.script)) b.append("const $run = (fn) => null;");
		if (/\$mount\b/.test(template.script)) b.append("const $mount = (fn) => null;");

		// Add the script
		b.append(template.script);
	}

	b.append(`let $output = "";`);

	if (template.markup) {
		b.append("/* User interface */");

		const status = {
			output: "",
			styleHash: template.styleHash || "",
			varNames: {},
			options,
		};

		// HACK: Stub the format function to run on the server
		// TODO: Add this to imports instead
		b.append('const t_fmt = (text) => (text != null ? text : "");');

		// Add the interface
		buildServerNode(template.markup, status, b);

		if (status.output) {
			b.append(`$output += \`${status.output}\`;`);
			status.output = "";
		}
	}

	b.append(`return $output;
			}
		}
	`);
}
