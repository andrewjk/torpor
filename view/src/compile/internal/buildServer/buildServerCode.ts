import type ComponentTemplate from "../../types/ComponentTemplate";
import Builder from "../Builder";
import buildServerNode from "./buildServerNode";

export default function buildServerCode(name: string, template: ComponentTemplate): string {
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

  buildServerTemplate(name, template, b);
  if (template.childComponents) {
    for (let child of template.childComponents) {
      buildServerTemplate(child.name || "ChildComponent", child, b);
    }
  }

  // TODO: export the component
  //b.append(`export default ${name};`);
  b.append(`${name};`);

  return b.toString();
}

function buildServerTemplate(name: string, template: ComponentTemplate, b: Builder) {
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
  if (template.contextProps?.length) {
    b.append(`$context = Object.assign({}, $context);`);
  }

  if (template.script) {
    // TODO: Mangling
    b.append("/* User script */");
    // HACK: Replace these with proper functions
    b.append("const $watch = (obj) => obj;");
    b.append("const $run = (fn) => null;");
    b.append(template.script);
  }

  b.append(`let $output = "";`);

  if (template.markup) {
    const status = {
      output: "",
      styleHash: template.styleHash || "",
      varNames: {},
    };
    b.append("/* User interface */");
    // HACK: Replace this with imports
    b.append('const t_fmt = (text) => text != null ? text : "";');
    buildServerNode(template.markup, status, b);
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
