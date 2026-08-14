import type Template from "../../../types/Template";
import type BuildOptions from "../../types/BuildOptions";
import Builder from "../../utils/Builder";
import collectMarkupExpressions from "../../utils/collectMarkupExpressions";
import markupRendersComponent from "../../utils/markupRendersComponent";
import buildStyles from "../client/buildStyles";
import type BuildServerStatus from "./BuildServerStatus";
import buildServerNode from "./buildServerNode";

const importsMap: Record<string, string> = {
	$watch: 'import { $watch } from "${folder}";',
	$bind: 'import { $bind } from "${folder}";',
	$handle: 'import { $handle } from "${folder}";',
	$cache: 'import { $cache } from "${folder}";',
	$await: 'import { $await } from "${folder}";',
	$pending: 'import { $pending } from "${folder}";',
	$refresh: 'import { $refresh } from "${folder}";',
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

	// Include markup expressions in import detection: `$`-primitives used
	// inside markup live in the template, not the script.
	for (const component of template.components) {
		if (component.markup) script += "\n" + collectMarkupExpressions(component.markup);
		if (component.error) script += "\n" + collectMarkupExpressions(component.error);
		if (component.head) script += "\n" + collectMarkupExpressions(component.head);
	}

	// Add default imports
	if (/\$watch\b/.test(script)) imports.add("$watch");
	if (/\$bind\b/.test(script)) imports.add("$bind");
	if (/\$handle\b/.test(script)) imports.add("$handle");
	if (/\$cache\b/.test(script)) imports.add("$cache");
	if (/\$await\b/.test(script)) imports.add("$await");
	if (/\$pending\b/.test(script)) imports.add("$pending");
	if (/\$refresh\b/.test(script)) imports.add("$refresh");
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
					`${current.props?.length ? "$props: Record<PropertyKey, any>" : "_$props?: Record<PropertyKey, any>"}`,
				`${
					current.contextProps?.length ||
					(current.markup && markupRendersComponent(current.markup)) ||
					(current.error && markupRendersComponent(current.error))
						? "$context"
						: "_$context"
				}?: Record<PropertyKey, any>`,
				`${current.slotProps?.length ? "$slots" : "_$slots"}?: Record<string, ServerSlotRender>`,
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

				// An @error block wraps the render in an implicit try/catch so
				// that render-time errors render the error content instead
				if (current.error) {
					b.append(`const t_try_body = t_body;`);
					b.append("try {");
				}

				buildServerNode(current.markup, status, b);

				if (status.output) {
					b.append(`t_body += \`${status.output}\`;`);
					status.output = "";
				}
			}
		} else if (chunk.script === "/* @error */") {
			if (current.markup && current.error) {
				const status: BuildServerStatus = {
					imports,
					output: "",
					styleHash: current.style?.hash || "",
					varNames: {},
					preserveWhitespace: false,
					options,
				};

				b.append(`} catch (${current.errorVar}) {`);
				b.append("t_body = t_try_body;");

				b.append("/* User interface error */");
				buildServerNode(current.error, status, b);

				if (status.output) {
					b.append(`t_body += \`${status.output}\`;`);
					status.output = "";
				}

				b.append("}");
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
