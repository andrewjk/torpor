import type Template from "../../../types/Template";
import type TemplateComponent from "../../../types/TemplateComponent";
import type BuildOptions from "../../types/BuildOptions";
import type SourceMapping from "../../types/SourceMapping";
import Builder from "../../utils/Builder";
import { codeRanges } from "../../utils/codeScanner";
import collectMarkupExpressions from "../../utils/collectMarkupExpressions";
import markupRendersComponent from "../../utils/markupRendersComponent";
import type BuildStatus from "./BuildStatus";
import addMappedText from "./addMappedText";
import addPopDevBoundary from "./addPopDevBoundary";
import addPushDevBoundary from "./addPushDevBoundary";
import buildFragmentText from "./buildFragmentText";
import buildNode from "./buildNode";

const importsMap: Record<string, string> = {
	$watch: 'import { $watch } from "${folder}";',
	$bind: 'import { $bind } from "${folder}";',
	$handle: 'import { $handle } from "${folder}";',
	$cache: 'import { $cache } from "${folder}";',
	$async: 'import { $async } from "${folder}";',
	$pending: 'import { $pending } from "${folder}";',
	$refresh: 'import { $refresh } from "${folder}";',
	$run: 'import { $run } from "${folder}";',
	$mount: 'import { $mount } from "${folder}";',
	$stream: 'import { $stream } from "${folder}";',
	fromElement: 'import { fromElement } from "${folder}";',
	fromServer: 'import { fromServer } from "${folder}";',
	fromWebSocket: 'import { fromWebSocket } from "${folder}";',
	$unwrap: 'import { $unwrap } from "${folder}";',
	$peek: 'import { $peek } from "${folder}";',
	$batch: 'import { $batch } from "${folder}";',
	t_region: 'import { t_region } from "${folder}";',
	t_push_region: 'import { t_push_region } from "${folder}";',
	t_pop_region: 'import { t_pop_region } from "${folder}";',
	t_rerun_region_effects: 'import { t_rerun_region_effects } from "${folder}";',
	t_run_control: 'import { t_run_control } from "${folder}";',
	t_run_branch: 'import { t_run_branch } from "${folder}";',
	t_list_item: 'import { t_list_item } from "${folder}";',
	t_run_list: 'import { t_run_list } from "${folder}";',
	t_run_await: 'import { t_run_await } from "${folder}";',
	t_run_try: 'import { t_run_try } from "${folder}";',
	t_add_fragment: 'import { t_add_fragment } from "${folder}";',
	t_add_element: 'import { t_add_element } from "${folder}";',
	t_apply_props: 'import { t_apply_props } from "${folder}";',
	t_class: 'import { t_class } from "${folder}";',
	t_style: 'import { t_style } from "${folder}";',
	t_attribute: 'import { t_attribute } from "${folder}";',
	t_dynamic: 'import { t_dynamic } from "${folder}";',
	t_fmt: 'import { t_fmt } from "${folder}";',
	t_fragment: 'import { t_fragment } from "${folder}";',
	t_fragment_el: 'import { t_fragment_el } from "${folder}";',
	t_event: 'import { t_event } from "${folder}";',
	t_animate: 'import { t_animate } from "${folder}";',
	t_root: 'import { t_root } from "${folder}";',
	t_root_el: 'import { t_root_el } from "${folder}";',
	t_anchor: 'import { t_anchor } from "${folder}";',
	t_child: 'import { t_child } from "${folder}";',
	t_next: 'import { t_next } from "${folder}";',
	t_skip: 'import { t_skip } from "${folder}";',
	t_frg: 'import { t_frg } from "${folder}";',
	t_save_hydration: 'import { t_save_hydration } from "${folder}";',
	t_restore_hydration: 'import { t_restore_hydration } from "${folder}";',
	t_elm: 'import { t_elm } from "${folder}";',
	t_txt: 'import { t_txt } from "${folder}";',
	t_cmt: 'import { t_cmt } from "${folder}";',
	t_print: 'import { t_print } from "${folder}";',
	ListItem: 'import { type ListItem } from "${folder}";',
	ListItemSpec: 'import { type ListItemSpec } from "${folder}";',
	SlotRender: 'import { type SlotRender } from "${folder}";',
	// HACK: this one's a bit different
	devContext: 'import { devContext } from "${folder}/dev";',
	t_push_dev_bound: 'import { t_push_dev_bound } from "${folder}/dev";',
	t_pop_dev_bound: 'import { t_pop_dev_bound } from "${folder}/dev";',
};

export default function buildCode(
	template: Template,
	map: SourceMapping[],
	options?: BuildOptions,
): string {
	let b = new Builder(options?.mapped);

	// Gather imports as we go so they can be placed at the top
	let imports = new Set<string>();
	imports.add("SlotRender");

	// Build the component
	buildTemplate(template, map, imports, b, options);

	let startSize = b.toString().length;

	// Add the gathered imports in alphabetical order
	if (imports.size) {
		const folder = options?.renderFolder ?? "@torpor/view";
		const sortedImports = Array.from(imports)
			.map((imp) => (importsMap[imp] ?? imp).replace("${folder}", folder))
			.sort()
			.reverse();
		b.prepend("");
		for (let imp of sortedImports) {
			b.prepend(imp);
		}
	}

	if (options?.mapped) {
		let endSize = b.toString().length;
		let diff = endSize - startSize + 1;
		for (let m of map) {
			m.compiled.start += diff;
			m.compiled.end += diff;
		}
	}

	return b.toString();
}

function buildTemplate(
	template: Template,
	map: SourceMapping[],
	imports: Set<string>,
	b: Builder,
	options?: BuildOptions,
) {
	// TODO: Do this while looping chunks
	let script = template.script.map((s) => s.script).join("\n");

	// Include markup expressions in import detection: `$`-primitives used
	// inside markup (e.g. `@if ($pending(...))`, `disabled={$pending(...)}`)
	// live in the template, not the script.
	for (const component of template.components) {
		if (component.markup) script += "\n" + collectMarkupExpressions(component.markup);
		if (component.error) script += "\n" + collectMarkupExpressions(component.error);
		if (component.head) script += "\n" + collectMarkupExpressions(component.head);
	}

	// Scan only the code in the script: strings, comments and regex literals
	// are stripped, so e.g. `$mount` inside a sample-code string doesn't
	// inject an import that nothing uses
	let scriptCode = codeRanges(script)
		.map(([start, end]) => script.substring(start, end))
		.join("");

	// Add default imports
	if (/\$watch\b/.test(scriptCode)) imports.add("$watch");
	if (/\$bind\b/.test(scriptCode)) imports.add("$bind");
	if (/\$handle\b/.test(scriptCode)) imports.add("$handle");
	if (/\$cache\b/.test(scriptCode)) imports.add("$cache");
	if (/\$async\b/.test(scriptCode)) imports.add("$async");
	if (/\$pending\b/.test(scriptCode)) imports.add("$pending");
	if (/\$refresh\b/.test(scriptCode)) imports.add("$refresh");
	if (/\$run\b/.test(scriptCode)) imports.add("$run");
	if (/\$mount\b/.test(scriptCode)) imports.add("$mount");
	if (/\$stream\b/.test(scriptCode)) imports.add("$stream");
	if (/\bfromElement\b/.test(scriptCode)) imports.add("fromElement");
	if (/\bfromServer\b/.test(scriptCode)) imports.add("fromServer");
	if (/\bfromWebSocket\b/.test(scriptCode)) imports.add("fromWebSocket");
	if (/\$unwrap\b/.test(scriptCode)) imports.add("$unwrap");
	if (/\$peek\b/.test(scriptCode)) imports.add("$peek");
	if (/\$batch\b/.test(scriptCode)) imports.add("$batch");

	let currentIndex = 0;
	let current = template.components[0];
	let status: BuildStatus = makeStatus(imports, map, current, options);
	let first = true;

	for (let chunk of template.script) {
		if (chunk.script === "/* @params */") {
			// Reset the status for each new function body
			if (!first) {
				status = makeStatus(imports, map, current, options);
			}
			first = false;

			// TODO: Support other params, like the user setting $context
			b.append(`
					${current.markup ? "$parent" : "_$parent"}: ParentNode,
					${current.markup ? "$anchor" : "_$anchor"}: Node | null,`);
			if (current.params !== undefined) {
				addMappedText("", current.params, ",", chunk.span, status, b);
			} else {
				b.append(
					`${current.props?.length ? "$props: Record<PropertyKey, any>" : "_$props?: Record<PropertyKey, any>"},`,
				);
			}
			b.append(`
				${
					current.contextProps?.length ||
					(current.markup && markupRendersComponent(current.markup)) ||
					(current.error && markupRendersComponent(current.error))
						? "$context"
						: "_$context"
				}?: Record<PropertyKey, any>,
				${current.slotProps?.length ? "$slots" : "_$slots"}?: Record<string, SlotRender>,`);
		} else if (chunk.script === ") /* @return_type */ {") {
			b.append("): void {");
		} else if (chunk.script === "/* @start */") {
			// Add the component to devContext for display in DevTools
			addPushDevBoundary("component", current.name || "Anon Component", status, b);

			// Redefine $context so that any newly added properties will only be passed to children
			if (current.contextProps?.length) {
				b.append(`$context = Object.assign({}, $context);`);
			}
		} else if (chunk.script === "/* @render */") {
			if (current.markup) {
				// Add the interface
				b.append("");
				b.append("/* User interface */");

				// An @error block wraps the render in an error boundary
				// (t_run_try), so that BOTH sync render errors and later
				// effect re-run errors (routed from triggerEffects) render
				// the error content, and a recovery re-render restores the
				// normal content. The content builds into $parent/$anchor
				// exactly as before — the boundary re-inserts at the same
				// position when it switches branches
				if (current.error) {
					status.imports.add("t_region");
					status.imports.add("t_run_try");
					b.append(`const t_error_region = t_region();`);
					b.append(`t_run_try(t_error_region, $anchor, () => {`);
				}

				buildFragmentText(current.markup, status, b);
				b.append("");
				buildNode(current.markup, status, b, "$parent", "$anchor", true);
			}
		} else if (chunk.script === "/* @error */") {
			if (current.markup && current.error) {
				b.append(`}, (_, ${current.errorVar ?? "err"}) => {`);
				b.append("");
				b.append("/* User interface error */");
				buildFragmentText(current.error, status, b);
				b.append("");
				buildNode(current.error, status, b, "$parent", "$anchor", true);
				b.append(`}${status.options.dev === true ? ', "runError"' : ""});`);
			}
		} else if (chunk.script === "/* @head */") {
			if (current.head) {
				// Add the head tags
				b.append("");
				b.append("/* Head */");
				status.inHead = true;
				buildNode(current.head, status, b, "$parent", "$anchor", true);
				status.inHead = false;
			}
		} else if (chunk.script === "/* @style */") {
			// No styles in the client
		} else if (chunk.script === "/* @end */") {
			addPopDevBoundary(status, b);
			currentIndex += 1;
			current = template.components[currentIndex];
		} else {
			addMappedText("", chunk.script, "", chunk.span, status, b);
		}
	}
}

function makeStatus(
	imports: Set<string>,
	map: SourceMapping[],
	current?: TemplateComponent,
	options?: BuildOptions,
): BuildStatus {
	return {
		imports,
		props: current?.props ?? [],
		contextProps: current?.contextProps ?? [],
		slotProps: current?.slotProps ?? [],
		styleHash: current?.style?.hash ?? "",
		map,
		varNames: {},
		fragmentStack: [],
		forVarNames: [],
		ns: false,
		preserveWhitespace: false,
		inHead: false,
		options: options ?? {},
	};
}
