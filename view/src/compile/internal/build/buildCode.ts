import type ComponentParts from "../../types/ComponentParts";
import type Import from "../../types/Import";
import type BuildStatus from "./BuildStatus";
import Builder from "./Builder";
import buildConfig from "./buildConfig";
import buildFragments from "./buildFragments";
import buildNode from "./buildNode";

export default function buildCode(name: string, parts: ComponentParts): string {
  const b = new Builder();

  let folder = buildConfig.folder;
  b.append(`
    import $watch from '${folder}/watch/$watch';
    import $run from '${folder}/watch/$run';
    import t_context from '${folder}/global/context';
    import t_push_range_to_parent from '${folder}/render/internal/pushRangeToParent';
    import t_push_range from '${folder}/render/internal/pushRange';
    import t_pop_range from '${folder}/render/internal/popRange';
    import t_run_control from '${folder}/render/internal/runControl';
    import t_run_branch from '${folder}/render/internal/runBranch';
    import t_run_list from '${folder}/render/internal/runList';
    import t_apply_props from '${folder}/render/internal/applyProps';
    import t_text from '${folder}/render/internal/formatText';
    import t_add_fragment from '${folder}/render/internal/addFragment';`);
  if (buildConfig.fragmentsUseCreateElement) {
    b.append(`
      import t_frg from '${folder}/render/internal/createFragment2';
      import t_elm from '${folder}/render/internal/createElement';
      import t_txt from '${folder}/render/internal/createText';
      import t_cmt from '${folder}/render/internal/createComment';`);
  } else {
    b.append(`
      import t_fragment from '${folder}/render/internal/getFragment';`);
  }
  // TODO: De-duplication
  let imports: Import[] = [];
  if (parts.imports) {
    imports = imports.concat(parts.imports);
  }
  if (parts.childComponents) {
    for (let child of parts.childComponents) {
      if (child.imports) {
        imports = imports.concat(child.imports);
      }
    }
  }
  if (imports.length) {
    b.append(`
      ${imports.map((i) => `import ${i.name} from '${i.path}';`).join("\n")}
    `);
  }

  buildTemplate(name, parts, b);
  if (parts.childComponents) {
    for (let child of parts.childComponents) {
      buildTemplate(child.name || "ChildComponent", child, b);
    }
  }

  b.append(`export default ${name};`);

  return b.toString();
}

function buildTemplate(name: string, parts: ComponentParts, b: Builder) {
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
  if (parts.contexts?.length) {
    b.append(`$context = Object.assign({}, $context);`);
  }

  if (parts.script) {
    // TODO: Mangling
    b.append(`
      /* User script */
      ${parts.script}
    `);
  }

  if (parts.template) {
    const status: BuildStatus = {
      props: parts.props || [],
      styleHash: parts.styleHash || "",
      varNames: {},
      fragmentStack: [],
      fragmentVars: new Map(),
      forVarNames: [],
    };
    b.append("/* User interface */");
    buildFragments(parts.template, status, b);
    b.append("");
    buildNode(parts.template, status, b, "$parent", "$anchor", true);
  }

  b.append(`}
    }
  `);
}
