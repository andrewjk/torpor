import type ComponentTemplate from "../../types/ComponentTemplate";
import Builder from "../Builder";
import type BuildStatus from "./BuildStatus";
import buildConfig from "./buildConfig";
import buildFragmentText from "./buildFragmentText";
import buildNode from "./buildNode";

const importsMap: Record<string, string> = {
	$watch: "import $watch from '${folder}/watch/$watch';",
	$unwrap: "import $unwrap from '${folder}/watch/$unwrap';",
	$run: "import $run from '${folder}/watch/$run';",
	$mount: "import $mount from '${folder}/watch/$mount';",
	t_flush: "import t_flush from '${folder}/watch/internal/flushMountEffects';",
	t_push_range_to_parent:
		"import t_push_range_to_parent from '${folder}/render/internal/pushRangeToParent';",
	t_push_range: "import t_push_range from '${folder}/render/internal/pushRange';",
	t_pop_range: "import t_pop_range from '${folder}/render/internal/popRange';",
	t_run_control: "import t_run_control from '${folder}/render/internal/runControl';",
	t_run_branch: "import t_run_branch from '${folder}/render/internal/runControlBranch';",
	t_run_list: "import t_run_list from '${folder}/render/internal/runList';",
	t_add_fragment: "import t_add_fragment from '${folder}/render/internal/addFragment';",
	t_apply_props: "import t_apply_props from '${folder}/render/internal/applyProps';",
	t_attribute: "import t_attribute from '${folder}/render/internal/setAttribute';",
	t_dynamic: "import t_dynamic from '${folder}/render/internal/setDynamicElement';",
	t_fmt: "import t_fmt from '${folder}/render/internal/formatText';",
	t_fragment: "import t_fragment from '${folder}/render/internal/getFragment';",
	t_anchor: "import t_anchor from '${folder}/render/internal/findAnchor';",
	t_root: "import t_root from '${folder}/render/internal/nodeRoot';",
	t_child: "import t_child from '${folder}/render/internal/nodeChild';",
	t_next: "import t_next from '${folder}/render/internal/nodeNext';",
	t_frg: "import t_frg from '${folder}/render/internal/createFragment';",
	t_elm: "import t_elm from '${folder}/render/internal/createElement';",
	t_txt: "import t_txt from '${folder}/render/internal/createText';",
	t_cmt: "import t_cmt from '${folder}/render/internal/createComment';",
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
			const name = imp.nonDefault ? `{ ${imp.name} }` : imp.name;
			const alias = imp.alias ? ` as ${imp.alias}` : "";
			imports.add(`import ${name}${alias} from '${imp.path}';`);
		}
	}

	b.append(`const ${name} = {
		name: "${name}",
		/**
		 * @param {Node} $parent
		 * @param {Node | null} $anchor
		 * @param {Object} [$props]
		 * @param {Object} [$slots]
		 * @param {Object} [$context]
		 */
		render: ($parent, $anchor, $props, $slots, $context) => {`);

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

		// Flush any $mount calls that were encountered
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
