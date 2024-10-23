import type BuildOptions from "../../../types/BuildOptions";
import type Template from "../../../types/Template";
import Builder from "../../utils/Builder";
import BuildServerStatus from "./BuildServerStatus";
import buildServerNode from "./buildServerNode";

export default function buildServerCode(
	name: string,
	template: Template,
	options?: BuildOptions,
): string {
	let b = new Builder();

	// Gather imports as we go so they can be placed at the top
	let imports = new Set<string>();
	imports.add('import type { ServerSlotRender } from "${folder}";');

	// Build the component and any child components
	buildServerTemplate(template, imports, b, options);

	// Add the gathered imports in alphabetical order
	if (imports.size) {
		b.prepend("");
		for (let imp of Array.from(imports).sort().reverse()) {
			b.prepend(imp.replace("${folder}", options?.renderFolder || "@tera/view"));
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

	// TODO: Do these within the render method, or make serverWatch, serverUnwrap etc imports
	// HACK: Stub reactivity functions to do nothing on the server
	if (/\$watch\b/.test(script)) b.append("const $watch = (obj: Record<PropertyKey, any>) => obj;");
	if (/\$unwrap\b/.test(script))
		b.append("const $unwrap = (obj: Record<PropertyKey, any>) => obj;");
	if (/\$run\b/.test(script)) b.append("const $run = (fn: Function) => null;");
	if (/\$mount\b/.test(script)) b.append("const $mount = (fn: Function) => null;");

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
					output: "",
					styleHash: current.styleHash || "",
					varNames: {},
					options,
				};

				// Add the interface
				b.append("/* User interface */");

				// HACK: Stub the format function to run on the server
				// TODO: Add this to imports instead
				b.append('const t_fmt = (text: string) => (text != null ? text : "");');

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
