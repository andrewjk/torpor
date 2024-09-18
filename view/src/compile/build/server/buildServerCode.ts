import type ComponentTemplate from "../../../types/ComponentTemplate";
import Builder from "../../Builder";
import buildConfig from "../client/buildConfig";
import buildServerNode from "./buildServerNode";

export default function buildServerCode(name: string, template: ComponentTemplate): string {
	let b = new Builder();

	// Gather imports as we go so they can be placed at the top
	// TODO: Only components?
	let imports = new Set<string>();

	// Build the component and any child components
	buildServerTemplate(name, template, imports, b);
	if (template.childComponents) {
		for (let child of template.childComponents) {
			buildServerTemplate(child.name || "ChildComponent", child, imports, b);
		}
	}

	// Add the gathered imports
	if (imports.size) {
		b.prepend("");
		for (let imp of Array.from(imports).reverse()) {
			b.prepend(imp.replace("${folder}", buildConfig.folder));
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
) {
	if (template.imports) {
		// TODO: Should probably consolidate imports e.g. when we've split them up
		for (let imp of template.imports) {
			const alias = imp.alias ? ` as ${imp.alias}` : "";
			const name = imp.nonDefault ? `{ ${imp.name}${alias} }` : imp.name;
			imports.add(`import ${name} from '${imp.path}';`);
		}
	}

	b.append(`const ${name} = {
		name: "${name}",
		/**
		 * @param {Object} [$props]
		 * @param {Object} [$context]
		 * @param {Object} [$slots]
		 */
		render: ($props, $context, $slots) => {`);

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
