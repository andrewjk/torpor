import type BuildOptions from "../../../types/BuildOptions";
import type ComponentTemplate from "../../../types/ComponentTemplate";
import Builder from "../../utils/Builder";
import type BuildStatus from "./BuildStatus";
import buildFragmentText from "./buildFragmentText";
import buildNode from "./buildNode";

// We were dynamically creating imports, which might still be useful for creating standalone components
const importsMap: Record<string, string> = {
	$watch: "import { $watch } from '${folder}';",
	$unwrap: "import { $unwrap } from '${folder}';",
	$run: "import { $run } from '${folder}';",
	$mount: "import { $mount } from '${folder}';",
	t_flush: "import { t_flush } from '${folder}';",
	t_range: "import { t_range } from '${folder}';",
	t_push_range: "import { t_push_range } from '${folder}';",
	t_pop_range: "import { t_pop_range } from '${folder}';",
	t_run_control: "import { t_run_control } from '${folder}';",
	t_run_branch: "import { t_run_branch } from '${folder}';",
	t_run_list: "import { t_run_list } from '${folder}';",
	t_add_fragment: "import { t_add_fragment } from '${folder}';",
	t_apply_props: "import { t_apply_props } from '${folder}';",
	t_attribute: "import { t_attribute } from '${folder}';",
	t_dynamic: "import { t_dynamic } from '${folder}';",
	t_fmt: "import { t_fmt } from '${folder}';",
	t_fragment: "import { t_fragment } from '${folder}';",
	t_event: "import { t_event } from '${folder}';",
	t_animate: "import { t_animate } from '${folder}';",
	t_root: "import { t_root } from '${folder}';",
	t_anchor: "import { t_anchor } from '${folder}';",
	t_child: "import { t_child } from '${folder}';",
	t_next: "import { t_next } from '${folder}';",
	t_frg: "import { t_frg } from '${folder}';",
	t_elm: "import { t_elm } from '${folder}';",
	t_txt: "import { t_txt } from '${folder}';",
	t_cmt: "import { t_cmt } from '${folder}';",
};

export default function buildCode(
	name: string,
	template: ComponentTemplate,
	options?: BuildOptions,
): string {
	let b = new Builder();

	// Gather imports as we go so they can be placed at the top
	let imports = new Set<string>();
	imports.add(`import type SlotRender from "\${folder}";`);

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
		for (let imp of Array.from(imports).sort().reverse()) {
			imp = importsMap[imp] || imp;
			b.prepend(imp.replace("${folder}", options?.renderFolder || "@tera/view"));
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

	if (template.docs?.description) {
		b.append(`
		/**
		 * ${template.docs.description}
		 */`);
	}

	let propsInterface = "any";
	if (template.docs?.props) {
		propsInterface = `{
			${template.docs.props.map((p) => `${p.description ? `/** ${p.description} */` + "\n" : ""}${p.name}${p.optional && "?"}: ${p.type};`).join("\n")}
		}`;
	}

	b.append(`
	const ${name} = {
		/**
		 * The component's name.
		 */
		name: "${name}",
		/**
		 * Mounts or hydrates the component into the supplied parent node.
		 * @param $parent -- The parent node.
		 * @param $anchor -- The node to mount the component before.
		 * @param $props -- The values that have been passed into the component as properties.
		 * @param $context -- Values that have been passed into the component from its ancestors.
		 * @param $slots -- Functions for rendering children into slot nodes within the component.
		 */
		render: ($parent: Node, $anchor: Node | null, $props: ${propsInterface}, $context: Record<PropertyKey, any>, $slots: Record<string, SlotRender>) => {`);

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
