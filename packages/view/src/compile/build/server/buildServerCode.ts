import type BuildOptions from "../../../types/BuildOptions";
import type Template from "../../../types/Template";
import Builder from "../../utils/Builder";
import buildStyles from "../client/buildStyles";
import type BuildServerStatus from "./BuildServerStatus";
import buildServerNode from "./buildServerNode";

const importsMap: Record<string, string> = {
	$watch: 'import { $watch } from "${folder}";',
	$cache: 'import { $cache } from "${folder}";',
	$run: 'import { $run } from "${folder}";',
	$mount: 'import { $mount } from "${folder}";',
	$unwrap: 'import { $unwrap } from "${folder}";',
	$peek: 'import { $peek } from "${folder}";',
	$batch: 'import { $batch } from "${folder}";',
	t_fmt: 'import { t_fmt } from "${folder}";',
	t_attr: 'import { t_attr } from "${folder}";',
	t_class: 'import { t_class } from "${folder}";',
	t_style: 'import { t_style } from "${folder}";',
	ServerSlotRender: 'import { type ServerSlotRender } from "${folder}";',
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
			b.prepend(imp.replace("${folder}", options?.renderFolder || "@torpor/view/ssr"));
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
	if (/\$cache\b/.test(script)) imports.add("$cache");
	if (/\$run\b/.test(script)) imports.add("$run");
	if (/\$mount\b/.test(script)) imports.add("$mount");
	if (/\$unwrap\b/.test(script)) imports.add("$unwrap");
	if (/\$peek\b/.test(script)) imports.add("$peek");
	if (/\$batch\b/.test(script)) imports.add("$batch");

	let currentIndex = 0;
	let current = template.components[0];

	let marker = 0;
	for (let i = 0; i < script.length; i++) {
		if (script.substring(i, i + "/* @params */".length) === "/* @params */") {
			b.append(script.substring(marker, i));

			// TODO: Support other params, like the user setting $context
			let params = [
				current.params ??
					`${current.props?.length ? "$props" : "_$props"}: Record<PropertyKey, any>`,
				`${current.contextProps?.length || current.needsContext ? "$context" : "_$context"}: Record<PropertyKey, any>`,
				`${current.slotProps?.length ? "$slots" : "_$slots?"}: Record<string, ServerSlotRender>`,
			];
			b.append(params.join(",\n"));

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

			// Declare t_head and t_body
			b.append(`let t_body = "";`);
			b.append(`let t_head = "";`);

			marker = i + "/* @start */".length;
		} else if (script.substring(i, i + "/* @render */".length) === "/* @render */") {
			b.append(script.substring(marker, i));
			//let userScript = script.substring(marker, i);
			//if (/[^\s]/.test(userScript)) {
			//	userScript = "\n/* eslint-disable */\n" + userScript.trim() + "\n/* eslint-enable */";
			//	b.append(userScript);
			//}

			if (current.markup) {
				const status: BuildServerStatus = {
					imports,
					output: "",
					styleHash: current.style?.hash || "",
					varNames: {},
					preserveWhitespace: false,
					options,
				};

				// Add the interface
				b.append("");
				b.append("/* User interface */");

				buildServerNode(current.markup, status, b);

				if (status.output) {
					b.append(`t_body += \`${status.output}\`;`);
					status.output = "";
				}
			}

			marker = i + "/* @render */".length;
		} else if (script.substring(i, i + "/* @head */".length) === "/* @head */") {
			b.append(script.substring(marker, i));
			//let userScript = script.substring(marker, i);
			//if (/[^\s]/.test(userScript)) {
			//	userScript = "\n/* eslint-disable */\n" + userScript.trim() + "\n/* eslint-enable */";
			//	b.append(userScript);
			//}

			// TODO: need to add e.g. a title to the head, but remove when changing page
			marker = i + "/* @head */".length;
		} else if (script.substring(i, i + "/* @style */".length) === "/* @style */") {
			b.append(script.substring(marker, i));
			//let userScript = script.substring(marker, i);
			//if (/[^\s]/.test(userScript)) {
			//	userScript = "\n/* eslint-disable */\n" + userScript.trim() + "\n/* eslint-enable */";
			//	b.append(userScript);
			//}

			if (current.style) {
				b.append("");
				b.append("/* Style */");

				// Replace multiple spaces with a single space
				const styles = buildStyles(current.style, current.style.hash)
					.replaceAll('"', '\\"')
					.replaceAll(/\s+/g, " ");
				b.append(`t_head += "<style id='${current.style.hash}'>${styles}</style>";\n`);
			}

			marker = i + "/* @style */".length;
		} else if (script.substring(i, i + "/* @end */".length) === "/* @end */") {
			b.append(script.substring(marker, i));
			b.append(`return { body: t_body, head: t_head };`);

			currentIndex += 1;
			current = template.components[currentIndex];

			marker = i + "/* @end */".length;
		}
	}

	b.append(script.substring(marker));
}
