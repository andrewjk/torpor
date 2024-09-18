import type ComponentTemplate from "../../../types/ComponentTemplate";
import Builder from "../../Builder";
import type BuildStatus from "./BuildStatus";
import buildConfig from "./buildConfig";
import buildFragmentText from "./buildFragmentText";
import buildNode from "./buildNode";

const importsMap: Record<string, string> = {
	$watch: "import { $watch } from '${folder}';",
	$unwrap: "import { $unwrap } from '${folder}';",
	$run: "import { $run } from '${folder}';",
	$mount: "import { $mount } from '${folder}';",
	t_flush: "import { flushMountEffects as t_flush } from '${folder}';",
	t_push_range_to_parent:
		"import { pushRangeToParent as t_push_range_to_parent } from '${folder}';",
	t_push_range: "import { pushRange as t_push_range } from '${folder}';",
	t_pop_range: "import { popRange as t_pop_range } from '${folder}';",
	t_run_control: "import { runControl as t_run_control } from '${folder}';",
	t_run_branch: "import { runControlBranch as t_run_branch } from '${folder}';",
	t_run_list: "import { runList as t_run_list } from '${folder}';",
	t_add_fragment: "import { addFragment as t_add_fragment } from '${folder}';",
	t_apply_props: "import { applyProps as t_apply_props } from '${folder}';",
	t_attribute: "import { setAttribute as t_attribute } from '${folder}';",
	t_dynamic: "import { setDynamicElement as t_dynamic } from '${folder}';",
	t_fmt: "import { formatText as t_fmt } from '${folder}';",
	t_fragment: "import { getFragment as t_fragment } from '${folder}';",
	t_event: "import { addEvent as t_event } from '${folder}';",
	t_animate: "import { addAnimation as t_animate } from '${folder}';",
	t_root: "import { nodeRoot as t_root } from '${folder}';",
	t_anchor: "import { nodeAnchor as t_anchor } from '${folder}';",
	t_child: "import { nodeChild as t_child } from '${folder}';",
	t_next: "import { nodeNext as t_next } from '${folder}';",
	t_frg: "import { createFragment as t_frg } from '${folder}';",
	t_elm: "import { createElement as t_elm } from '${folder}';",
	t_txt: "import { createText as t_txt } from '${folder}';",
	t_cmt: "import { createComment as t_cmt } from '${folder}';",
};

export default function buildCode(name: string, template: ComponentTemplate): string {
	let b = new Builder();

	// Gather imports as we go so they can be placed at the top
	let imports = new Set<string>();

	// Build the component and any child components
	buildTemplate(name, template, imports, b);
	if (template.childComponents) {
		for (let child of template.childComponents) {
			buildTemplate(child.name || "ChildComponent", child, imports, b);
		}
	}

	// Add the gathered imports
	if (imports.size) {
		b.prepend("");
		for (let imp of Array.from(imports).reverse()) {
			imp = importsMap[imp] || imp;
			b.prepend(imp.replace("${folder}", buildConfig.folder));
		}
	}

	// Export the component
	b.append(`export default ${name};`);

	return b.toString();
}

function buildTemplate(
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
		 * @param {Node} $parent
		 * @param {Node | null} $anchor
		 * @param {Object} [$props]
		 * @param {Object} [$context]
		 * @param {Object} [$slots]
		 */
		render: ($parent, $anchor, $props, $context, $slots) => {`);

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
		// Add default imports
		if (/\$watch\b/.test(template.script)) imports.add("$watch");
		if (/\$unwrap\b/.test(template.script)) imports.add("$unwrap");
		if (/\$run\b/.test(template.script)) imports.add("$run");
		if (/\$mount\b/.test(template.script)) imports.add("$mount");

		// Add the script
		b.append(`
			/* User script */
			${template.script}
		`);
	}

	if (template.markup) {
		const status: BuildStatus = {
			imports,
			props: template.props || [],
			styleHash: template.styleHash || "",
			varNames: {},
			fragmentStack: [],
			forVarNames: [],
		};

		// Add the interface
		b.append("/* User interface */");
		buildFragmentText(template.markup, status, b);
		b.append("");
		buildNode(template.markup, status, b, "$parent", "$anchor", true);

		// Flush any $mount calls that were encountered -- move this to
		// addFragment, because we also have to flush events and animations
		if (imports.has("$mount")) {
			status.imports.add("t_flush");
			b.append("");
			b.append("t_flush();");
		}
	}

	b.append(`}
		}
	`);
}
