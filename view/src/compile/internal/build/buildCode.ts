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
  t_push_range_to_parent:
    "import t_push_range_to_parent from '${folder}/render/internal/pushRangeToParent';",
  t_push_range: "import t_push_range from '${folder}/render/internal/pushRange';",
  t_pop_range: "import t_pop_range from '${folder}/render/internal/popRange';",
  t_run_control: "import t_run_control from '${folder}/render/internal/runControl';",
  t_run_branch: "import t_run_branch from '${folder}/render/internal/runControlBranch';",
  t_run_list: "import t_run_list from '${folder}/render/internal/runList';",
  t_add_fragment: "import t_add_fragment from '${folder}/render/internal/addFragment';",
  t_apply_props: "import t_apply_props from '${folder}/render/internal/applyProps';",
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

export default function buildCode(name: string, parts: ComponentTemplate): string {
  let imports = new Set<string>();
  let b = new Builder();

  buildTemplate(name, parts, imports, b);
  if (parts.childComponents) {
    for (let child of parts.childComponents) {
      buildTemplate(child.name || "ChildComponent", child, imports, b);
    }
  }

  let folder = buildConfig.folder;

  b.append(`export default ${name};`);

  return (
    Array.from(imports)
      .map((i) => {
        i = importsMap[i] || i;
        return i.replace("${folder}", folder);
      })
      .join("\n") +
    "\n\n" +
    b.toString()
  );
}

function buildTemplate(name: string, parts: ComponentTemplate, imports: Set<string>, b: Builder) {
  if (parts.imports) {
    for (let i of parts.imports) {
      imports.add(`import ${i.name} from '${i.path}';`);
    }
  }

  b.append(`
    const ${name} = {
      name: "${name}",
      /**
       * @param {Node} $parent
       * @param {Node | null} $anchor
       * @param {Object} [$props]
       * @param {Object} [$slots]
       * @param {Object} [$context]
       */
      render: ($parent, $anchor, $props, $slots, $context) => {`);

  // Redefine $context so that any newly added properties will only be passed to children
  if (parts.contextProps?.length) {
    b.append(`$context = Object.assign({}, $context);`);
  }

  if (parts.script) {
    if (/\$watch\b/.test(parts.script)) imports.add("$watch");
    if (/\$unwrap\b/.test(parts.script)) imports.add("$unwrap");
    if (/\$run\b/.test(parts.script)) imports.add("$run");

    // TODO: Mangling
    b.append(`
      /* User script */
      ${parts.script}
    `);
  }

  if (parts.markup) {
    const status: BuildStatus = {
      imports,
      props: parts.props || [],
      styleHash: parts.styleHash || "",
      varNames: {},
      fragmentStack: [],
      forVarNames: [],
    };
    b.append("/* User interface */");
    buildFragmentText(parts.markup, status, b);
    b.append("");
    buildNode(parts.markup, status, b, "$parent", "$anchor", true);
  }

  b.append(`}
    }
  `);
}
