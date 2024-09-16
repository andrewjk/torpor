import type ComponentTemplate from "../../../types/ComponentTemplate";
import Builder from "../../Builder";
import type BuildStatus from "./BuildStatus";
import buildConfig from "./buildConfig";
import buildFragmentText from "./buildFragmentText";
import buildNode from "./buildNode";

const importsMap: Record<string, string> = {
	$watch: "import $watch from '${folder}/$watch';",
	$unwrap: "import $unwrap from '${folder}/$unwrap';",
	$run: "import $run from '${folder}/$run';",
	$mount: "import $mount from '${folder}/$mount';",
	t_flush: "import t_flush from '${folder}/watch/flushMountEffects';",
	t_push_range_to_parent:
		"import t_push_range_to_parent from '${folder}/render/pushRangeToParent';",
	t_push_range: "import t_push_range from '${folder}/render/pushRange';",
	t_pop_range: "import t_pop_range from '${folder}/render/popRange';",
	t_run_control: "import t_run_control from '${folder}/render/runControl';",
	t_run_branch: "import t_run_branch from '${folder}/render/runControlBranch';",
	t_run_list: "import t_run_list from '${folder}/render/runList';",
	t_add_fragment: "import t_add_fragment from '${folder}/render/addFragment';",
	t_apply_props: "import t_apply_props from '${folder}/render/applyProps';",
	t_attribute: "import t_attribute from '${folder}/render/setAttribute';",
	t_dynamic: "import t_dynamic from '${folder}/render/setDynamicElement';",
	t_fmt: "import t_fmt from '${folder}/render/formatText';",
	t_fragment: "import t_fragment from '${folder}/render/getFragment';",
	t_event: "import t_event from '${folder}/render/addEvent';",
	t_animate: "import t_animate from '${folder}/render/addAnimation';",
	t_anchor: "import t_anchor from '${folder}/render/findAnchor';",
	t_root: "import t_root from '${folder}/render/nodeRoot';",
	t_child: "import t_child from '${folder}/render/nodeChild';",
	t_next: "import t_next from '${folder}/render/nodeNext';",
	t_frg: "import t_frg from '${folder}/render/createFragment';",
	t_elm: "import t_elm from '${folder}/render/createElement';",
	t_txt: "import t_txt from '${folder}/render/createText';",
	t_cmt: "import t_cmt from '${folder}/render/createComment';",
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
