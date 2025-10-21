import type Template from "../../../types/Template";
import type TemplateComponent from "../../../types/TemplateComponent";
import type BuildOptions from "../../types/BuildOptions";
import type SourceMapping from "../../types/SourceMapping";
import Builder from "../../utils/Builder";
import type BuildStatus from "./BuildStatus";
import addDevBoundary from "./addDevBoundary";
import addMappedText from "./addMappedText";
import buildFragmentText from "./buildFragmentText";
import buildNode from "./buildNode";

const importsMap: Record<string, string> = {
	$watch: 'import { $watch } from "${folder}";',
	$cache: 'import { $cache } from "${folder}";',
	$run: 'import { $run } from "${folder}";',
	$mount: 'import { $mount } from "${folder}";',
	$unwrap: 'import { $unwrap } from "${folder}";',
	$peek: 'import { $peek } from "${folder}";',
	$batch: 'import { $batch } from "${folder}";',
	t_region: 'import { t_region } from "${folder}";',
	t_push_region: 'import { t_push_region } from "${folder}";',
	t_pop_region: 'import { t_pop_region } from "${folder}";',
	t_run_control: 'import { t_run_control } from "${folder}";',
	t_run_branch: 'import { t_run_branch } from "${folder}";',
	t_list_item: 'import { t_list_item } from "${folder}";',
	t_run_list: 'import { t_run_list } from "${folder}";',
	t_add_fragment: 'import { t_add_fragment } from "${folder}";',
	t_apply_props: 'import { t_apply_props } from "${folder}";',
	t_class: 'import { t_class } from "${folder}";',
	t_style: 'import { t_style } from "${folder}";',
	t_attribute: 'import { t_attribute } from "${folder}";',
	t_dynamic: 'import { t_dynamic } from "${folder}";',
	t_fmt: 'import { t_fmt } from "${folder}";',
	t_fragment: 'import { t_fragment } from "${folder}";',
	t_event: 'import { t_event } from "${folder}";',
	t_animate: 'import { t_animate } from "${folder}";',
	t_root: 'import { t_root } from "${folder}";',
	t_anchor: 'import { t_anchor } from "${folder}";',
	t_child: 'import { t_child } from "${folder}";',
	t_next: 'import { t_next } from "${folder}";',
	t_skip: 'import { t_skip } from "${folder}";',
	t_frg: 'import { t_frg } from "${folder}";',
	t_elm: 'import { t_elm } from "${folder}";',
	t_txt: 'import { t_txt } from "${folder}";',
	t_cmt: 'import { t_cmt } from "${folder}";',
	t_print: 'import { t_print } from "${folder}";',
	ListItem: 'import { type ListItem } from "${folder}";',
	SlotRender: 'import { type SlotRender } from "${folder}";',
	// HACK: this one's a bit different
	devContext: 'import { devContext } from "${folder}/dev";',
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
		b.prepend("");
		for (let imp of Array.from(imports).sort().reverse()) {
			let importStatement = importsMap[imp] ?? imp;
			let folder =
				options?.renderFolder ??
				(options?.dev === true && imp.startsWith("$") ? "@torpor/view/dev" : "@torpor/view");
			importStatement = importStatement.replace("${folder}", folder);
			b.prepend(importStatement);
		}
	}

	if (options?.mapped) {
		let endText = b.toString();
		let endSize = endText.length;
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

	// Add default imports
	if (/\$watch\b/.test(script)) imports.add("$watch");
	if (/\$cache\b/.test(script)) imports.add("$cache");
	if (/\$run\b/.test(script)) imports.add("$run");
	if (/\$mount\b/.test(script)) imports.add("$mount");
	if (/\$unwrap\b/.test(script)) imports.add("$unwrap");
	/*if (/\$peek\b/.test(script))*/ imports.add("$peek");
	if (/\$batch\b/.test(script)) imports.add("$batch");

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
			let params = [
				`${current.markup ? "$parent" : "_$parent"}: ParentNode`,
				`${current.markup ? "$anchor" : "_$anchor"}: Node | null`,
				current.params ??
					`${current.props?.length ? "$props: Record<PropertyKey, any>" : "// @ts-ignore\n$props: Record<PropertyKey, any> | undefined"}`,
				`${current.contextProps?.length ? "$context" : "// @ts-ignore\n$context"}: Record<PropertyKey, any>`,
				`${current.slotProps?.length ? "$slots" : "// @ts-ignore\n$slots"}?: Record<string, SlotRender>`,
			];
			b.append(params.join(",\n"));
		} else if (chunk.script === ") /* @return_type */ {") {
			b.append("): void {");
		} else if (chunk.script === "/* @start */") {
			// Add the component to devContext for display in DevTools
			addDevBoundary(current.name ?? "AnonComponent", status, b);

			// Redefine $context so that any newly added properties will only be passed to children
			if (current.contextProps?.length) {
				b.append(`$context = Object.assign({}, $context);`);
			}

			// NOTE: We're isolating the user script by setting `context.activeTarget =
			// null` and then setting it back at the end, but maybe it would be better to
			// make it so that signals only affect effects that they are under e.g. so
			// that creating a $state in a component doesn't affect any $runs outside
			// the component?
			b.append("$peek(() => { /**/");
			b.append("");
		} else if (chunk.script === "/* @render */") {
			if (current.markup) {
				// Add the interface
				b.append("");
				b.append("/* User interface */");
				buildFragmentText(current.markup, status, b);
				b.append("");
				buildNode(current.markup, status, b, "$parent", "$anchor", true);
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
			b.append("/**/ });");
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
