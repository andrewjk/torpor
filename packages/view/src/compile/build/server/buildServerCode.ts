import type Template from "../../../types/Template";
import type BuildOptions from "../../types/BuildOptions";
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
	let b = new Builder(options?.mapped);

	// Gather imports as we go so they can be placed at the top
	let imports = new Set<string>();
	imports.add("ServerSlotRender");

	// Build the component and any child components
	buildServerTemplate(template, imports, b, options);

	// Add the gathered imports in alphabetical order
	if (imports.size) {
		const folder = options?.renderFolder ?? "@torpor/view/ssr";
		const sortedImports = Array.from(imports)
			.map((imp) => (importsMap[imp] ?? imp).replace("${folder}", folder))
			.sort()
			.reverse();
		b.prepend("");
		for (let imp of sortedImports) {
			b.prepend(imp);
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
	// TODO: Do this while looping chunks
	let script = template.script.map((s) => s.script).join("\n");

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

	for (let chunk of template.script) {
		if (chunk.script === "/* @params */") {
			// TODO: Support other params, like the user setting $context
			let params = [
				current.params ??
					`${current.props?.length ? "$props: Record<PropertyKey, any>" : "// @ts-ignore\n$props?: Record<PropertyKey, any>"}`,
				`${current.contextProps?.length ? "$context" : "// @ts-ignore\n$context"}?: Record<PropertyKey, any>`,
				`${current.slotProps?.length ? "$slots" : "// @ts-ignore\n$slots"}?: Record<string, ServerSlotRender>`,
			];
			b.append(params.join(",\n") + ",");
		} else if (chunk.script === ") /* @return_type */ {") {
			b.append("): { body: string; head: string } {");
		} else if (chunk.script === "/* @start */") {
			// Redefine $context so that any newly added properties will only be passed to children
			if (current.contextProps?.length) {
				b.append(`$context = Object.assign({}, $context);`);
			}

			// Declare t_head and t_body
			b.append(`let t_body = "";`);
			b.append(`let t_head = "";`);
		} else if (chunk.script === "/* @render */") {
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
		} else if (chunk.script === "/* @head */") {
			//let userScript = script.substring(marker, i);
			//if (/[^\s]/.test(userScript)) {
			//	userScript = "\n/* eslint-disable */\n" + userScript.trim() + "\n/* eslint-enable */";
			//	b.append(userScript);
			//}
			// TODO: need to add e.g. a title to the head, but remove when changing page
		} else if (chunk.script === "/* @style */") {
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
		} else if (chunk.script === "/* @end */") {
			b.append(`return { body: t_body, head: t_head };`);

			currentIndex += 1;
			current = template.components[currentIndex];
		} else {
			b.append(chunk.script);
		}
	}
}
