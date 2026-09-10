import type Template from "../../../types/Template";
import type BuildOptions from "../../types/BuildOptions";
import type ParentNode from "../../types/nodes/ParentNode";
import type TemplateNode from "../../types/nodes/TemplateNode";
import Builder from "../../utils/Builder";
import { codeRanges } from "../../utils/codeScanner";
import collectMarkupExpressions from "../../utils/collectMarkupExpressions";
import isControlNode from "../../utils/isControlNode";
import markupRendersComponent from "../../utils/markupRendersComponent";
import buildStyles from "../client/buildStyles";
import type BuildServerStatus from "./BuildServerStatus";
import buildServerNode from "./buildServerNode";
import flushOutput from "./flushOutput";

const importsMap: Record<string, string> = {
	$watch: 'import { $watch } from "${folder}";',
	$bind: 'import { $bind } from "${folder}";',
	$cache: 'import { $cache } from "${folder}";',
	$async: 'import { $async } from "${folder}";',
	$pending: 'import { $pending } from "${folder}";',
	$refresh: 'import { $refresh } from "${folder}";',
	$run: 'import { $run } from "${folder}";',
	$onmount: 'import { $onmount } from "${folder}";',
	$stream: 'import { $stream } from "${folder}";',
	fromElement: 'import { fromElement } from "${folder}";',
	fromServer: 'import { fromServer } from "${folder}";',
	fromWebSocket: 'import { fromWebSocket } from "${folder}";',
	$unwrap: 'import { $unwrap } from "${folder}";',
	$peek: 'import { $peek } from "${folder}";',
	$batch: 'import { $batch } from "${folder}";',
	t_server_flush: 'import { t_server_flush } from "${folder}";',
	t_await_server: 'import { t_await_server } from "${folder}";',
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

	// Scan only the code in the script: strings, comments and regex literals
	// are stripped, so e.g. `$onmount` inside a sample-code string doesn't
	// inject an import that nothing uses
	let scriptCode = codeRanges(script)
		.map(([start, end]) => script.substring(start, end))
		.join("");

	// Add default imports
	if (/\$watch\b/.test(scriptCode)) imports.add("$watch");
	if (/\$bind\b/.test(scriptCode)) imports.add("$bind");
	if (/\$cache\b/.test(scriptCode)) imports.add("$cache");
	if (/\$async\b/.test(scriptCode)) imports.add("$async");
	if (/\$pending\b/.test(scriptCode)) imports.add("$pending");
	if (/\$refresh\b/.test(scriptCode)) imports.add("$refresh");
	if (/\$run\b/.test(scriptCode)) imports.add("$run");
	if (/\$onmount\b/.test(scriptCode)) imports.add("$onmount");
	if (/\$stream\b/.test(scriptCode)) imports.add("$stream");
	if (/\bfromElement\b/.test(scriptCode)) imports.add("fromElement");
	if (/\bfromServer\b/.test(scriptCode)) imports.add("fromServer");
	if (/\bfromWebSocket\b/.test(scriptCode)) imports.add("fromWebSocket");
	if (/\$unwrap\b/.test(scriptCode)) imports.add("$unwrap");
	if (/\$peek\b/.test(scriptCode)) imports.add("$peek");
	if (/\$batch\b/.test(scriptCode)) imports.add("$batch");

	// Server components are async functions, so that a component containing a
	// `source: "server"` `@await` boundary can await its fetches and its
	// children can be awaited wherever they render (ASYNC.md §7.10). Find the
	// chunks holding each component's `function` declaration so they can be
	// rewritten on the way out, without mutating the shared parse result.
	const asyncChunks = new Set<number>();
	for (let [i, chunk] of template.script.entries()) {
		if (chunk.script === "/* @params */" && i > 0) {
			asyncChunks.add(i - 1);
		}
	}

	let currentIndex = 0;
	let current = template.components[0];

	for (let [chunkIndex, chunk] of template.script.entries()) {
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
			b.append("): Promise<{ body: string; head: string }> {");
		} else if (chunk.script === "/* @start */") {
			// Redefine $context so that any newly added properties will only be passed to children
			if (current.contextProps?.length) {
				b.append(`$context = Object.assign({}, $context);`);
			}

			// A component with an `@await` boundary renders inside a flush,
			// which starts its server fetches without blocking the render and
			// substitutes the resolved boundaries at the end
			const hasAwait =
				containsAwaitGroup(current.markup) ||
				containsAwaitGroup(current.error) ||
				containsAwaitGroup(current.head);
			if (hasAwait) {
				imports.add("t_server_flush");
				b.append(`return t_server_flush(async () => {`);
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
					awaitCount: 0,
					options,
				};

				// Add the interface
				b.append("");
				b.append("/* User interface */");

				// An @error block wraps the render in an implicit try/catch so
				// that render-time errors render the error content instead
				if (current.error) {
					b.append(`const t_try_body = t_body;`);
					b.append(`const t_try_head = t_head;`);
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
					awaitCount: 0,
					options,
				};

				b.append(`} catch (${current.errorVar}) {`);
				b.append("t_body = t_try_body;");
				b.append("t_head = t_try_head;");

				b.append("/* User interface error */");
				buildServerNode(current.error, status, b);

				if (status.output) {
					b.append(`t_body += \`${status.output}\`;`);
					status.output = "";
				}

				b.append("}");
			}
		} else if (chunk.script === "/* @head */") {
			if (current.head) {
				// Build the head tags (title, meta, etc) into the head string, so
				// that they can be hoisted into the document's <head> element.
				// The tags are built like any other markup (with the scoped
				// class name suppressed), only into t_head instead of t_body
				const status: BuildServerStatus = {
					imports,
					output: "",
					styleHash: current.style?.hash || "",
					varNames: {},
					preserveWhitespace: false,
					inHead: true,
					awaitCount: 0,
					options,
				};

				b.append("");
				b.append("/* Head */");

				buildServerNode(current.head, status, b);

				flushOutput(status, b);
			}
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

			// Close the flush opened in @start
			if (
				containsAwaitGroup(current.markup) ||
				containsAwaitGroup(current.error) ||
				containsAwaitGroup(current.head)
			) {
				b.append(`});`);
			}

			currentIndex += 1;
			current = template.components[currentIndex];
		} else {
			// The component's `function` declaration chunk: make it async. A
			// declaration the user already wrote as `async function` doesn't
			// match (the lookbehind skips it), so it passes through unchanged.
			// The name may carry generic parameters (`function Form<T>(`).
			if (asyncChunks.has(chunkIndex)) {
				b.append(
					chunk.script.replace(
						/(?<!async\s)function\s+([A-Za-z_$][\w$]*)((?:<(?:[^<>]|<[^<>]*>)*>)?)\s*\($/,
						"async function $1$2(",
					),
				);
			} else {
				b.append(chunk.script);
			}
		}
	}
}

/**
 * Whether a markup tree contains an `@await` boundary, so the component's
 * render must be wrapped in a flush.
 */
function containsAwaitGroup(node: TemplateNode | undefined | null): boolean {
	if (node === undefined || node === null) {
		return false;
	}
	if (isControlNode(node) && node.operation === "@await group") {
		return true;
	}
	// Text and comment nodes have no children; everything else is a ParentNode
	if (node.type !== "text" && node.type !== "comment") {
		for (let child of (node as ParentNode).children) {
			if (containsAwaitGroup(child)) {
				return true;
			}
		}
	}
	return false;
}
