import type BuildOptions from "../../../types/BuildOptions";
import type Template from "../../../types/Template";
import Builder from "../../utils/Builder";
import type BuildServerStatus from "./BuildServerStatus";
import buildServerNode from "./buildServerNode";

const importsMap: Record<string, string> = {
	$watch: 'import { $watch } from "${folder}";',
	$unwrap: 'import { $unwrap } from "${folder}";',
	$run: 'import { $run } from "${folder}";',
	$mount: 'import { $mount } from "${folder}";',
	t_fmt: 'import { t_fmt } from "${folder}";',
	ServerSlotRender: 'import type { ServerSlotRender } from "${folder}";',
};

export default function buildServerCode(template: Template, options?: BuildOptions): string {
	let b = new Builder();

	// Gather imports as we go so they can be placed at the top
	let imports = new Set<string>();
	imports.add("ServerSlotRender");

	// Build the component and any child components
	buildServerTemplate(template, imports, b, options);

	// Add the gathered imports in alphabetical order
	if (imports.size) {
		b.prepend("");
		for (let imp of Array.from(imports).sort().reverse()) {
			imp = importsMap[imp] || imp;
			b.prepend(imp.replace("${folder}", options?.renderFolder || "@tera/view/ssr"));
		}
	}

	return b.toString();
}

function buildServerTemplate(
	template: Template,
	imports: Set<string>,
	b: Builder,
	options?: BuildOptions,
) {
	let script = template.script || "";

	// Add default imports
	if (/\$watch\b/.test(script)) imports.add("$watch");
	if (/\$unwrap\b/.test(script)) imports.add("$unwrap");
	if (/\$run\b/.test(script)) imports.add("$run");
	if (/\$mount\b/.test(script)) imports.add("$mount");

	let currentIndex = 0;
	let current = template.components[0];

	let marker = 0;
	for (let i = 0; i < script.length; i++) {
		if (script.substring(i, i + "/* @params */".length) === "/* @params */") {
			b.append(script.substring(marker, i));

			// TODO: Support other params, like the user setting $context
			b.append(
				`${current.params || "$props?: Record<PropertyKey, any>"},
				$context?: Record<PropertyKey, any>,
				$slots?: Record<string, ServerSlotRender>`,
			);

			marker = i + "/* @params */".length;
		} else if (script.substring(i, i + "/* @start */".length) === "/* @start */") {
			b.append(script.substring(marker, i));

			// Make sure we've got $props if we're going to be using it
			if (current.props?.length) {
				b.append(`$props ??= {};`);
			}

			// Redefine $context so that any newly added properties will only be passed to children
			if (current.contextProps?.length) {
				b.append(`$context = Object.assign({}, $context);`);
			}

			marker = i + "/* @start */".length;
		} else if (script.substring(i, i + "/* @render */".length) === "/* @render */") {
			b.append(script.substring(marker, i));

			if (current.markup) {
				const status: BuildServerStatus = {
					imports,
					output: "",
					styleHash: current.style?.hash || "",
					varNames: {},
					options,
				};

				// Add the interface
				b.append("");
				b.append("/* User interface */");
				b.append(`let $output = "";`);

				// Add the interface
				buildServerNode(current.markup, status, b);

				if (status.output) {
					b.append(`$output += \`${status.output}\`;`);
					status.output = "";
				}
			}

			marker = i + "/* @render */".length;
		} else if (script.substring(i, i + "/* @end */".length) === "/* @end */") {
			b.append(script.substring(marker, i));
			b.append("return $output;");

			currentIndex += 1;
			current = template.components[currentIndex];

			marker = i + "/* @end */".length;
		}
	}

	b.append(script.substring(marker));
}
