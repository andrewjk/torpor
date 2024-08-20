import type ComponentParts from "../../types/ComponentParts";
import type Import from "../../types/Import";
import Builder from "../Builder";
import buildConfig from "../build/buildConfig";
import buildServerNode from "./buildServerNode";

export default function buildServerCode(name: string, parts: ComponentParts): string {
  let b = new Builder();

  // TODO: Imports
  /*
  let folder = buildConfig.folder;
  b.append(`
    import t_fmt from '${folder}/render/internal/formatText';`);
  // TODO: De-duplication
  // This is also the same as build, could it be merged
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
    */

  buildServerTemplate(name, parts, b);
  if (parts.childComponents) {
    for (let child of parts.childComponents) {
      buildServerTemplate(child.name || "ChildComponent", child, b);
    }
  }

  // TODO: export the component
  //b.append(`export default ${name};`);
  b.append(`${name};`);

  return b.toString();
}

function buildServerTemplate(name: string, parts: ComponentParts, b: Builder) {
  b.append(`
    const ${name} = {
      name: "${name}",
      /**
       * @param {Object} [$props]
       * @param {Object} [$slots]
       * @param {Object} [$context]
       */
      render: ($props, $slots, $context) => {`);

  // Redefine $context so that any newly added properties will only be passed to children
  if (parts.contexts?.length) {
    b.append(`$context = Object.assign({}, $context);`);
  }

  if (parts.script) {
    // TODO: Mangling
    b.append("/* User script */");
    // HACK: Replace this with proper functions
    b.append("const $watch = (obj) => obj;");
    b.append(parts.script);
  }

  if (parts.template) {
    const status = { output: "" };
    b.append("/* User interface */");
    // HACK: Replace this with imports
    b.append('const t_fmt = (text) => text != null ? text : "";');
    b.append('let $output = "";');
    buildServerNode(parts.template, status, b);
    if (status.output) {
      b.append(`$output += \`${status.output}\`;`);
      status.output = "";
    }
  }

  b.append(`return $output;
      }
    }
  `);
}
