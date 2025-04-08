import { type BuildOptions } from "../../../types/BuildOptions";
import { type Template } from "../../../types/Template";
import Builder from "../../utils/Builder";
import { type BuildStatus } from "./BuildStatus";
import buildFragmentText from "./buildFragmentText";
import buildNode from "./buildNode";

const importsMap: Record<string, string> = {
	$watch: 'import { $watch } from "${folder}";',
	$unwrap: 'import { $unwrap } from "${folder}";',
	$run: 'import { $run } from "${folder}";',
	$mount: 'import { $mount } from "${folder}";',
	t_flush: 'import { t_flush } from "${folder}";',
	t_range: 'import { t_range } from "${folder}";',
	t_push_range: 'import { t_push_range } from "${folder}";',
	t_pop_range: 'import { t_pop_range } from "${folder}";',
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
	t_frg: 'import { t_frg } from "${folder}";',
	t_elm: 'import { t_elm } from "${folder}";',
	t_txt: 'import { t_txt } from "${folder}";',
	t_cmt: 'import { t_cmt } from "${folder}";',
	ListItem: 'import { type ListItem } from "${folder}";',
	SlotRender: 'import { type SlotRender } from "${folder}";',
};

export default function buildCode(template: Template, options?: BuildOptions): string {
	let b = new Builder();

	// Gather imports as we go so they can be placed at the top
	let imports = new Set<string>();
	imports.add("SlotRender");

	// Build the component
	buildTemplate(template, imports, b);

	// Add the gathered imports in alphabetical order
	if (imports.size) {
		b.prepend("");
		for (let imp of Array.from(imports).sort().reverse()) {
			imp = importsMap[imp] || imp;
			b.prepend(imp.replace("${folder}", options?.renderFolder || "@torpor/view"));
		}
	}

	return b.toString();
}

function buildTemplate(template: Template, imports: Set<string>, b: Builder) {
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
			let params = [
				"$parent: ParentNode",
				"$anchor: Node | null",
				current.params ??
					`${current.props?.length ? "$props" : "// @ts-ignore\n$props?"}: Record<PropertyKey, any>`,
				`${current.contextProps?.length ? "" : "// @ts-ignore\n"}$context?: Record<PropertyKey, any>`,
				`${current.slotProps?.length ? "" : "// @ts-ignore\n"}$slots?: Record<string, SlotRender>`,
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

			b.append("");

			marker = i + "/* @start */".length;
		} else if (script.substring(i, i + "/* @render */".length) === "/* @render */") {
			b.append(script.substring(marker, i));

			if (current.markup) {
				const status: BuildStatus = {
					imports,
					props: current.props || [],
					contextProps: current.contextProps || [],
					slotProps: current.slotProps || [],
					styleHash: current.style?.hash || "",
					varNames: {},
					fragmentStack: [],
					forVarNames: [],
					ns: false,
					preserveWhitespace: false,
				};

				// Add the interface
				b.append("");
				b.append("/* User interface */");
				buildFragmentText(current.markup, status, b);
				b.append("");
				buildNode(current.markup, status, b, "$parent", "$anchor", true);
			}

			marker = i + "/* @render */".length;
		} else if (script.substring(i, i + "/* @end */".length) === "/* @end */") {
			b.append(script.substring(marker, i));

			currentIndex += 1;
			current = template.components[currentIndex];

			// TODO: Only if the component has $mount
			// Flush any $mount calls that were encountered -- move this to
			// addFragment, because we also have to flush events and animations
			if (imports.has("$mount")) {
				imports.add("t_flush");
				b.append("");
				b.append("t_flush();");
			}

			marker = i + "/* @end */".length;
		}
	}

	b.append(script.substring(marker));
}
