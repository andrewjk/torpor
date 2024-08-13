import BuildResult from "../types/BuildResult";
import ComponentParts from "../types/ComponentParts";
import Import from "../types/Import";
import Attribute from "../types/nodes/Attribute";
import ControlNode from "../types/nodes/ControlNode";
import ElementNode from "../types/nodes/ElementNode";
import Fragment from "../types/nodes/Fragment";
import Node from "../types/nodes/Node";
import TextNode from "../types/nodes/TextNode";
import isSpecialNode from "../types/nodes/isSpecialNode";
import StyleBlock from "../types/styles/StyleBlock";
import Builder from "./internal/Builder";
import { maybeAppend, trimAny, trimMatched, trimQuotes } from "./internal/utils";

// TODO: Too many branches for ifs etc?

interface BuildStatus {
  props: string[];
  styleHash: string;
  varNames: Record<string, number>;
  fragmentStack: {
    fragment?: Fragment;
    path: string;
  }[];
  fragmentVars: Map<string, string>;
  forVarNames: string[];
}

export default function build(name: string, parts: ComponentParts): BuildResult {
  const result: BuildResult = {
    code: buildCode(name, parts),
    styles: parts.style ? buildStyles(name, parts) : undefined,
    styleHash: parts.styleHash,
  };
  return result;
}

function buildCode(name: string, parts: ComponentParts): string {
  const b = new Builder();

  // For test and demo
  let folder = "../../../../../tera/view/src";
  // For the external bench
  //folder = "../view/src";
  b.append(`
    import $watch from '${folder}/watch/$watch';
    import $run from '${folder}/watch/$run';
    import t_push_range_to_parent from '${folder}/render/internal/pushRangeToParent';
    import t_push_range from '${folder}/render/internal/pushRange';
    import t_pop_range from '${folder}/render/internal/popRange';
    import t_run_control from '${folder}/render/internal/runControl';
    import t_run_branch from '${folder}/render/internal/runBranch';
    import t_run_list from '${folder}/render/internal/runList';
    import t_apply_props from '${folder}/render/internal/applyProps';
    import t_text from '${folder}/render/internal/formatText';
    import t_fragment from '${folder}/render/internal/createFragment';
    import t_add_fragment from '${folder}/render/internal/addFragment';
    import t_context from '${folder}/global/context';
  `);
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

function buildFragments(node: ControlNode, status: BuildStatus, b: Builder) {
  b.append(`const t_fragments = [];`);

  const fragments: Fragment[] = [];
  gatherFragments(node, status, fragments);
}

function gatherFragments(
  node: Node,
  status: BuildStatus,
  fragments: Fragment[],
  currentFragment?: Fragment,
) {
  switch (node.type) {
    case "control": {
      gatherControlFragments(node as ControlNode, status, fragments, currentFragment!);
      break;
    }
    case "component": {
      gatherComponentFragments(node as ElementNode, status, fragments, currentFragment!);
      break;
    }
    case "element": {
      gatherElementFragments(node as ElementNode, status, fragments, currentFragment!);
      break;
    }
    case "text": {
      const content = (node as TextNode).content;
      if (currentFragment) {
        currentFragment.text += isReactive(content) ? "#" : content;
      }
      break;
    }
    case "special": {
      gatherSpecialFragments(node as ElementNode, status, fragments, currentFragment!);
      break;
    }
  }
}

function gatherControlFragments(
  node: ControlNode,
  status: BuildStatus,
  allFragments: Fragment[],
  currentFragment: Fragment,
) {
  switch (node.operation) {
    case "@if group":
    case "@switch group":
    case "@for group":
    case "@await group": {
      // Add a placeholder if it's a branching control node
      currentFragment.text += "<!>";
      for (let child of node.children) {
        gatherFragments(child, status, allFragments, currentFragment);
      }
      break;
    }
    default: {
      // Add a new fragment if it's a control branch and it has children
      node.fragment = { number: allFragments.length, text: "", events: [] };
      allFragments.push(node.fragment);
      for (let child of node.children) {
        gatherFragments(child, status, allFragments, node.fragment);
      }
      break;
    }
  }
}

function gatherComponentFragments(
  node: ElementNode,
  status: BuildStatus,
  allFragments: Fragment[],
  currentFragment: Fragment,
) {
  currentFragment.text += "<!>";

  // Add fragments for slots if there are children
  if (node.children.length) {
    node.fragment = { number: allFragments.length, text: "", events: [] };
    allFragments.push(node.fragment);
    for (let child of node.children) {
      // TODO: Make sure it's not a :fill node
      gatherFragments(child, status, allFragments, node.fragment);
    }
  }
}

function gatherElementFragments(
  node: ElementNode,
  status: BuildStatus,
  fragments: Fragment[],
  currentFragment: Fragment,
) {
  currentFragment.text += `<${node.tagName}`;
  let attributesText = node.attributes
    .filter((a) => !a.name.startsWith("on"))
    .map((a) => {
      if (isReactive(a.value)) {
        // Adding a placeholder for reactive attributes seems to speed things
        // up, especially in the case of data attributes
        return `${a.name}=""`;
      } else {
        return `${a.name}${a.value != null ? `=${a.value}` : ""}`;
      }
    })
    .join(" ");
  if (attributesText) {
    currentFragment.text += " " + attributesText;
  }
  currentFragment.text += ">";
  for (let child of node.children) {
    gatherFragments(child, status, fragments, currentFragment);
  }
  currentFragment.text += `</${node.tagName}>`;
}

function gatherSpecialFragments(
  node: ElementNode,
  status: BuildStatus,
  allFragments: Fragment[],
  currentFragment: Fragment,
) {
  switch (node.tagName) {
    case ":slot": {
      currentFragment.text += "<!>";

      // Add a new fragment for default slot content
      node.fragment = { number: allFragments.length, text: "", events: [] };
      allFragments.push(node.fragment);
      for (let child of node.children) {
        gatherFragments(child, status, allFragments, node.fragment);
      }
      break;
    }
    case ":fill": {
      // Add a new fragment for filled slot content
      node.fragment = { number: allFragments.length, text: "", events: [] };
      allFragments.push(node.fragment);
      for (let child of node.children) {
        gatherFragments(child, status, allFragments, node.fragment);
      }
      break;
    }
  }
}

function declareFragment(node: ControlNode | ElementNode, status: BuildStatus, b: Builder) {
  if (node.fragment) {
    const fragment = node.fragment;
    const fragmentName = `t_fragment_${fragment.number}`;
    const fragmentText = fragment.text.replaceAll("`", "\\`").replaceAll(/\s+/g, " ");
    b.append(
      `const ${fragmentName} = t_fragment(t_fragments, ${fragment.number}, \`${fragmentText}\`);`,
    );
    const root = node.type === "control" && (node as ControlNode).operation === "@root";

    let existingVarPaths = new Map<string, string>();
    declareFragmentVars(node.fragment, node, ["0:ch"], status, b, existingVarPaths, root);
  }
}

function declareFragmentVars(
  fragment: Fragment,
  node: Node,
  path: string[],
  status: BuildStatus,
  b: Builder,
  existingVarPaths: Map<string, string>,
  root = false,
) {
  switch (node.type) {
    case "control": {
      declareControlFragmentVars(
        fragment,
        node as ControlNode,
        path,
        status,
        b,
        existingVarPaths,
        root,
      );
      break;
    }
    case "component": {
      declareComponentFragmentVars(
        fragment,
        node as ElementNode,
        path,
        status,
        b,
        existingVarPaths,
      );
      break;
    }
    case "element": {
      declareElementFragmentVars(
        fragment,
        node as ElementNode,
        path,
        status,
        b,
        existingVarPaths,
        root,
      );
      break;
    }
    case "text": {
      declareTextFragmentVars(fragment, node as TextNode, path, status, b, existingVarPaths);
      break;
    }
    case "special": {
      declareSpecialFragmentVars(fragment, node as ElementNode, path, status, b, existingVarPaths);
      break;
    }
  }
}

function declareControlFragmentVars(
  fragment: Fragment,
  node: ControlNode,
  path: string[],
  status: BuildStatus,
  b: Builder,
  existingVarPaths: Map<string, string>,
  root = false,
) {
  switch (node.operation) {
    case "@if group":
    case "@switch group":
    case "@for group":
    case "@await group": {
      const operation = node.operation.substring(1).replace(" group", "");
      declareParentAnchorFragmentVars(fragment, node, path, status, b, existingVarPaths, operation);
      break;
    }
    default: {
      for (let child of node.children) {
        declareFragmentVars(fragment, child, path, status, b, existingVarPaths, root);
      }
      break;
    }
  }
}

function declareComponentFragmentVars(
  fragment: Fragment,
  node: ElementNode,
  path: string[],
  status: BuildStatus,
  b: Builder,
  existingVarPaths: Map<string, string>,
) {
  declareParentAnchorFragmentVars(fragment, node, path, status, b, existingVarPaths, "comp");
}

function declareElementFragmentVars(
  fragment: Fragment,
  node: ElementNode,
  path: string[],
  status: BuildStatus,
  b: Builder,
  existingVarPaths: Map<string, string>,
  root = false,
) {
  const pathIndex = path.slice(path.lastIndexOf("0:ch")).length - 1;
  path.push(`${pathIndex}:el:${node.tagName}`);

  const hasReactiveAttribute = node.attributes.some((a) => isReactiveAttribute(a.name, a.value));
  const setAttributes = root || hasReactiveAttribute;

  if (setAttributes) {
    node.varName = nextVarName(node.tagName, status);
    const varPath = getFragmentVarPath(fragment, node.varName, path, existingVarPaths);
    b.append(`const ${node.varName} = ${varPath};`);
    status.fragmentVars.set(varPath, node.varName);
  }

  const oldPathLength = path.length;
  path.push("0:ch");
  for (let child of node.children) {
    declareFragmentVars(fragment, child, path, status, b, existingVarPaths);
  }
  path.splice(oldPathLength);
}

function declareTextFragmentVars(
  fragment: Fragment,
  node: TextNode,
  path: string[],
  status: BuildStatus,
  b: Builder,
  existingVarPaths: Map<string, string>,
) {
  // Text nodes get merged together
  if (!path[path.length - 1].endsWith("txt")) {
    const pathIndex = path.slice(path.lastIndexOf("0:ch")).length - 1;
    path.push(`${pathIndex}:txt`);
  }

  if (isReactive(node.content)) {
    node.varName = nextVarName("text", status);
    const varPath = getFragmentVarPath(fragment, node.varName, path, existingVarPaths);
    b.append(`const ${node.varName} = ${varPath};`);
    status.fragmentVars.set(varPath, node.varName);
  }
}

function declareSpecialFragmentVars(
  fragment: Fragment,
  node: ElementNode,
  path: string[],
  status: BuildStatus,
  b: Builder,
  existingVarPaths: Map<string, string>,
) {
  switch (node.tagName) {
    case ":slot": {
      declareParentAnchorFragmentVars(fragment, node, path, status, b, existingVarPaths, "slot");
      break;
    }
    case ":fill": {
      for (let child of node.children) {
        declareFragmentVars(fragment, child, path, status, b, existingVarPaths);
      }
      break;
    }
  }
}

function declareParentAnchorFragmentVars(
  fragment: Fragment,
  node: ControlNode | ElementNode,
  path: string[],
  status: BuildStatus,
  b: Builder,
  existingVarPaths: Map<string, string>,
  name: string,
) {
  const parentIndex = path.lastIndexOf("0:ch");

  // If the parent index is 0 it means it is the fragment, which can't be used as a parent
  // In that case we don't set the parentName so that the existing parent will be used
  //if (parentIndex > 0) {
  const parentPath = path.slice(0, parentIndex);
  const parentVarPath = getFragmentVarPath(fragment, "?", parentPath, existingVarPaths);
  if (parentIndex === 0) {
    node.parentName = parentVarPath;
  } else if (status.fragmentVars.has(parentVarPath)) {
    node.parentName = status.fragmentVars.get(parentVarPath);
  } else {
    // TODO: Get the actual element that it is, which may involve getting parents of control nodes too
    node.parentName = nextVarName(`${name}_parent`, status);
    b.append(`const ${node.parentName} = ${parentVarPath};`);
    status.fragmentVars.set(parentVarPath, node.parentName);
  }
  //}

  const pathIndex = path.length - parentIndex - 1;
  path.push(`${pathIndex}:${name}`);
  node.varName = nextVarName(`${name}_anchor`, status);
  const varPath = getFragmentVarPath(fragment, node.varName, path, existingVarPaths);
  b.append(`const ${node.varName} = ${varPath};`);
  status.fragmentVars.set(varPath, node.varName);
}

function getFragmentVarPath(
  fragment: Fragment,
  name: string,
  path: string[],
  existingVarPaths: Map<string, string>,
): string {
  let varPath = `t_fragment_${fragment.number}`;
  let childIndex = -2;
  for (let i = 0; i < path.length; i++) {
    const part = path[i].split(":")[1];
    if (part === "ch") {
      if (childIndex != -2) {
        //varPath += `.childNodes[${childIndex}]`;
        // This seems a little faster:
        varPath += ".firstChild";
        for (let i = 0; i < childIndex; i++) {
          varPath += ".nextSibling";
        }
      }
      childIndex = -1;
    } else {
      childIndex += 1;
    }
  }
  if (childIndex != -2) {
    //varPath += `.childNodes[${childIndex}]`;
    // This seems a little faster:
    varPath += ".firstChild";
    for (let i = 0; i < childIndex; i++) {
      varPath += ".nextSibling";
    }
  }

  // HACK: allow passing in "?" to ignore the parentVarPath
  if (name !== "?") {
    for (let [existingName, existingPath] of existingVarPaths) {
      if (varPath.includes(existingPath)) {
        varPath = varPath.replace(existingPath, existingName);
      }
    }
    existingVarPaths.set(name, varPath);
  }

  return varPath;
}

function addFragment(
  node: ControlNode | ElementNode,
  status: BuildStatus,
  b: Builder,
  parentName: string,
  anchorName: string,
) {
  if (node.fragment) {
    const fragment = node.fragment;
    const fragmentName = `t_fragment_${fragment.number}`;
    b.append(`t_add_fragment(${fragmentName}, ${parentName}, ${anchorName});`);
    for (let ev of fragment.events) {
      b.append(`${ev.varName}.addEventListener("${ev.eventName}", ${ev.handler});`);
    }
  }
}

function buildNode(
  node: Node,
  status: BuildStatus,
  b: Builder,
  parentName: string,
  anchorName: string,
  root = false,
) {
  switch (node.type) {
    case "control": {
      buildControlNode(node as ControlNode, status, b, parentName, anchorName);
      break;
    }
    case "component": {
      buildComponentNode(node as ElementNode, status, b, parentName, anchorName, root);
      break;
    }
    case "element": {
      buildElementNode(node as ElementNode, status, b, parentName, anchorName, root);
      break;
    }
    case "text": {
      buildTextNode(node as TextNode, status, b, parentName, anchorName);
      break;
    }
    case "special": {
      buildSpecialNode(node as ElementNode, status, b, parentName, anchorName);
      break;
    }
    default: {
      throw new Error(`Invalid node type: ${node.type}`);
    }
  }
}

function buildControlNode(
  node: ControlNode,
  status: BuildStatus,
  b: Builder,
  parentName: string,
  anchorName: string,
) {
  switch (node.operation) {
    case "@root": {
      buildRootNode(node, status, b, parentName, anchorName);
      break;
    }
    case "@if group": {
      buildIfNode(node, status, b, parentName, anchorName);
      break;
    }
    case "@if":
    case "@else if":
    case "@else": {
      // These get handled with @if group, above
      break;
    }
    case "@switch group": {
      buildSwitchNode(node, status, b, parentName, anchorName);
    }
    case "@case":
    case "@default": {
      // These get handled with @switch, above
      break;
    }
    case "@for group": {
      buildForNode(node, status, b, parentName, anchorName);
      break;
    }
    case "@for":
    case "@key": {
      // These get handled with @for, above
      break;
    }
    case "@await group": {
      buildAwaitNode(node, status, b, parentName, anchorName);
      break;
    }
    case "@await":
    case "@then":
    case "@catch": {
      // These get handled with @await group, above
      break;
    }
    case "@const":
    case "@console":
    case "@debugger": {
      buildScriptNode(node, b);
      break;
    }
    case "@function": {
      b.append("");
      buildScriptNode(node, b);
      b.append("");
      break;
    }
    default: {
      throw new Error(`Invalid operation: ${node.operation}`);
    }
  }
}

function buildRootNode(
  node: ControlNode,
  status: BuildStatus,
  b: Builder,
  parentName: string,
  anchorName: string,
) {
  declareFragment(node, status, b);

  status.fragmentStack.push({
    fragment: node.fragment,
    path: "0:ch/",
  });
  buildNode(node.children[0], status, b, parentName, anchorName, true);
  status.fragmentStack.pop();

  addFragment(node, status, b, parentName, anchorName);
}

function buildIfNode(
  node: ControlNode,
  status: BuildStatus,
  b: Builder,
  parentName: string,
  anchorName: string,
) {
  const ifAnchorName = node.varName!;
  const ifParentName = node.parentName || ifAnchorName + ".parentNode";
  const ifRangeName = nextVarName("if_range", status);

  // Filter non-control branches (spaces)
  const branches = node.children.filter((n) => n.type === "control") as ControlNode[];

  // Add an else branch if there isn't one, so that the content will be cleared if no branches match
  if (branches.findIndex((n) => n.operation === "@else") === -1) {
    const elseBranch: ControlNode = {
      type: "control",
      operation: "@else",
      statement: "else",
      children: [],
    };
    branches.push(elseBranch);
  }

  b.append("");
  b.append(`
      /* @if */
      const ${ifRangeName} = {};
      t_run_control(${ifRangeName}, () => {`);

  for (let [i, branch] of branches.entries()) {
    buildIfBranch(branch, status, b, ifParentName, ifAnchorName, ifRangeName, i);
  }

  b.append(`});`);
}

function buildIfBranch(
  node: ControlNode,
  status: BuildStatus,
  b: Builder,
  parentName: string,
  anchorName: string,
  rangeName: string,
  index: number,
) {
  b.append(`${node.statement} {`);
  b.append(`t_run_branch(${rangeName}, ${index}, () => {`);

  declareFragment(node, status, b);

  status.fragmentStack.push({
    fragment: node.fragment,
    path: "",
  });
  for (let child of node.children) {
    buildNode(child, status, b, parentName, anchorName);
  }
  status.fragmentStack.pop();

  addFragment(node, status, b, parentName, anchorName);

  b.append(`});`);
  b.append(`}`);
}

function buildSwitchNode(
  node: ControlNode,
  status: BuildStatus,
  b: Builder,
  parentName: string,
  anchorName: string,
) {
  const switchParentName = node.parentName!;
  const switchAnchorName = node.varName!;
  const switchRangeName = nextVarName("switch_range", status);

  // Filter non-control branches (spaces)
  const branches = node.children.filter((n) => n.type === "control") as ControlNode[];

  // Add a default branch if there isn't one, so that the content will be cleared if no branches match
  if (branches.findIndex((n) => n.operation === "@default") === -1) {
    const defaultBranch: ControlNode = {
      type: "control",
      operation: "@default",
      statement: "default",
      children: [],
    };
    branches.push(defaultBranch);
  }

  b.append("");
  b.append(`
      /* @switch */
      const ${switchRangeName} = {};
      t_run_control(${switchRangeName}, () => {
        ${node.statement} {`);

  for (let [i, branch] of branches.entries()) {
    buildSwitchBranch(
      branch as ControlNode,
      status,
      b,
      switchParentName,
      switchAnchorName,
      switchRangeName,
      i,
    );
  }

  b.append(`}
    });`);
}

function buildSwitchBranch(
  node: ControlNode,
  status: BuildStatus,
  b: Builder,
  parentName: string,
  anchorName: string,
  rangeName: string,
  index: number,
) {
  b.append(`${node.statement} {`);
  b.append(`t_run_branch(${rangeName}, ${index}, () => {`);

  declareFragment(node, status, b);

  status.fragmentStack.push({
    fragment: node.fragment,
    path: "",
  });
  for (let child of node.children) {
    buildNode(child, status, b, parentName, anchorName);
  }
  status.fragmentStack.pop();

  addFragment(node, status, b, parentName, anchorName);

  b.append(`});`);
  b.append(`break;`);
  b.append(`}`);
}

const forLoopRegex = /for\s*\((.+?);.*?;.*?\)/;
const forLoopVarsRegex = /(?:let\s+|var\s+){0,1}([^\s,;+=]+)(?:\s*=\s*[^,;]+){0,1}/g;
const forOfRegex = /for\s*\(\s*(?:let\s*|var\s*){0,1}(.+?)\s+(?:of|in).*?\)/;

function buildForNode(
  node: ControlNode,
  status: BuildStatus,
  b: Builder,
  parentName: string,
  anchorName: string,
) {
  const forParentName = node.parentName!;
  const forAnchorName = node.varName!;

  // HACK:
  node = node.children[0] as ControlNode;

  // HACK: Need to wrangle the declaration(s) out of the for loop and put them in data
  // TODO: Handle destructuring, quotes, comments etc
  const forVarNames: string[] = [];
  const forIndexMatch = node.statement.match(forLoopRegex);
  if (forIndexMatch) {
    const forVarMatches = forIndexMatch[1].matchAll(forLoopVarsRegex);
    for (let match of forVarMatches) {
      forVarNames.push(match[1]);
    }
  } else {
    const forOfMatch = node.statement.match(forOfRegex);
    if (forOfMatch) {
      const match = forOfMatch[1];
      if (
        (match.startsWith("{") && match.endsWith("}")) ||
        (match.startsWith("[") && match.endsWith("]"))
      ) {
        forVarNames.push(
          ...trimMatched(trimMatched(match, "{", "}"), "[", "]")
            .split(",")
            .map((m) => m.trim()),
        );
      } else {
        forVarNames.push(match);
      }
    }
  }

  const oldRangeName = nextVarName("old_range", status);
  const oldItemRangeName = nextVarName("old_range", status);
  const forRangeName = nextVarName("for_range", status);
  const forItemsName = nextVarName("for_items", status);

  // Get the key node if it's been set
  const key = node.children.find(
    (n) => n.type === "control" && (n as ControlNode).operation === "@key",
  );
  const keyStatement = key ? (key as ControlNode).statement : "";

  b.append("");
  b.append(`
      /* @for */
      let ${forItemsName} = [];
      let ${forRangeName} = {};
      let ${oldRangeName} = t_push_range_to_parent(${forRangeName});
      $run(function runFor() {
        let ${oldItemRangeName} = t_push_range(${forRangeName});
        let t_new_items = [];
        ${node.statement} {
          t_new_items.push({
            ${keyStatement ? `key: ${trimAny(keyStatement.substring(keyStatement.indexOf("=") + 1).trim(), ";")},` : ""}
            data: $watch({ ${forVarNames.join(",\n")} })
          });
        }
        t_run_list(
          ${forParentName},
          ${forAnchorName},
          ${forItemsName},
          t_new_items,
          function createForItem(t_parent, t_item, t_before) {
    `);

  status.forVarNames = forVarNames;
  buildForItem(node, status, b, "t_parent");
  status.forVarNames = [];

  b.append(`}
        );
        ${forItemsName} = t_new_items;
        t_pop_range(${oldItemRangeName});
      });
      t_pop_range(${oldRangeName});`);
}

function buildForItem(node: ControlNode, status: BuildStatus, b: Builder, parentName: string) {
  const oldRangeName = nextVarName("old_range", status);

  b.append(`let ${oldRangeName} = t_push_range_to_parent(t_item);`);

  declareFragment(node, status, b);

  status.fragmentStack.push({
    fragment: node.fragment!,
    path: "",
  });
  for (let child of node.children) {
    if (child.type === "control" && (child as ControlNode).operation === "@key") {
      continue;
    }
    buildNode(child, status, b, parentName, "t_before");
  }
  status.fragmentStack.pop();

  addFragment(node, status, b, parentName, "t_before");

  b.append(`t_pop_range(${oldRangeName});`);
  b.append(`});`);
}

function buildAwaitNode(
  node: ControlNode,
  status: BuildStatus,
  b: Builder,
  parentName: string,
  anchorName: string,
) {
  const awaitParentName = node.parentName!;
  const awaitAnchorName = node.varName!;
  const awaitRangeName = nextVarName("await_range", status);
  const awaitTokenName = nextVarName("await_token", status);
  const oldRangeName = nextVarName("old_range", status);

  // Filter non-control branches (spaces)
  const branches = node.children.filter((n) => n.type === "control") as ControlNode[];

  // Make sure all branches exist
  let awaitBranch = branches.find((n) => n.operation === "@await")!;
  if (!awaitBranch) {
    // TODO: Error handling
  }
  let thenBranch = branches.find((n) => n.operation === "@then");
  if (!thenBranch) {
    thenBranch = {
      type: "control",
      operation: "@then",
      statement: "then",
      children: [],
    };
  }
  let catchBranch = branches.find((n) => n.operation === "@catch");
  if (!catchBranch) {
    catchBranch = {
      type: "control",
      operation: "@catch",
      statement: "catch",
      children: [],
    };
  }

  const awaiterName = trimMatched(awaitBranch.statement.substring("await".length).trim(), "(", ")");
  const thenVar = trimMatched(thenBranch.statement.substring("then".length).trim(), "(", ")");
  const catchVar = trimMatched(catchBranch.statement.substring("catch".length).trim(), "(", ")");

  // Use an incrementing token to make sure only the last request gets handled
  // TODO: This might have unforeseen consequences
  b.append("");
  b.append(`
    /* @await */
    const ${awaitRangeName} = { index: -1 };
    let ${awaitTokenName} = 0;
    t_run_control(${awaitRangeName}, () => {
      ${awaitTokenName}++;`);

  buildAwaitBranch(awaitBranch, status, b, awaitParentName, awaitAnchorName, awaitRangeName, 0);

  b.append(`
    ((token) => {
      ${awaiterName}
      .then((${thenVar}) => {
      if (token === ${awaitTokenName}) {
        let ${oldRangeName} = t_push_range(${awaitRangeName});`);

  buildAwaitBranch(thenBranch, status, b, awaitParentName, awaitAnchorName, awaitRangeName, 1);

  b.append(`t_pop_range(${oldRangeName});
      }
    })
    .catch((${catchVar}) => {
      if (token === ${awaitTokenName}) {
        let ${oldRangeName} = t_push_range(${awaitRangeName});`);

  buildAwaitBranch(catchBranch, status, b, awaitParentName, awaitAnchorName, awaitRangeName, 2);

  b.append(`t_pop_range(${oldRangeName});
          }
        });
      })(${awaitTokenName});
    });`);
}

function buildAwaitBranch(
  node: ControlNode,
  status: BuildStatus,
  b: Builder,
  parentName: string,
  anchorName: string,
  rangeName: string,
  index: number,
) {
  b.append(`t_run_branch(${rangeName}, ${index}, () => {`);

  declareFragment(node, status, b);

  status.fragmentStack.push({
    fragment: node.fragment!,
    path: "",
  });
  for (let child of node.children) {
    buildNode(child, status, b, parentName, anchorName);
  }
  status.fragmentStack.pop();

  addFragment(node, status, b, parentName, anchorName);

  b.append(`});`);
}

function buildComponentNode(
  node: ElementNode,
  status: BuildStatus,
  b: Builder,
  parentName: string,
  anchorName: string,
  root = false,
) {
  b.append("");
  b.append("/* @component */");

  // Props
  const componentHasProps = node.attributes.length || root;
  const propsName = componentHasProps ? nextVarName("props", status) : "undefined";
  if (componentHasProps) {
    // TODO: defaults etc props
    b.append(`const ${propsName} = $watch({});`);
    for (let { name, value } of node.attributes) {
      if (name.startsWith("{") && name.endsWith("}")) {
        name = name.substring(1, name.length - 1);
        b.append(`$run(() => ${propsName}["${name}"] = ${name});`);
      } else {
        let reactive = value.startsWith("{") && value.endsWith("}");
        if (reactive) {
          value = value.substring(1, value.length - 1);
        }
        if (name === "class") {
          // TODO: How to handle dynamic classes etc
          // Probably just compile down to a string?
          value = `"${trimQuotes(value)} tera-${status.styleHash}"`;
        }
        const setProp = `${propsName}["${name}"] = ${value || "true"}`;
        b.append(reactive ? `$run(() => ${setProp});` : `${setProp};`);
      }
    }
    // PERF: Does this have much of an impact??
    if (root) {
      b.append(`
        if ($props) {
          const propNames = [${status.props.map((p) => `'${p}'`).join(", ")}];
          for (let name of Object.keys($props)) {
            if (!name.startsWith("$") && !propNames.includes(name)) {
              $run(() => ${propsName}[name] = $props[name]);
            }
          }
        }`);
    }
  }

  // Slots
  const componentHasSlots = node.children.length;
  const slotsName = componentHasSlots ? nextVarName("slots", status) : "undefined";
  if (componentHasSlots) {
    b.append(`const ${slotsName} = {};`);
    for (let slot of node.children) {
      if (isSpecialNode(slot)) {
        const nameAttribute = slot.attributes.find((a) => a.name === "name");
        const slotName = nameAttribute ? trimQuotes(nameAttribute.value) : "_";
        b.append(`${slotsName}["${slotName}"] = ($sparent, $sanchor, $sprops) => {`);

        declareFragment(slot, status, b);

        status.fragmentStack.push({
          fragment: slot.fragment,
          path: "",
        });
        for (let child of slot.children) {
          buildNode(child, status, b, "$sparent", "$sanchor");
        }
        status.fragmentStack.pop();

        addFragment(slot, status, b, "$sparent", "$sanchor");

        b.append(`}`);
      }
    }
  }

  // Build an anchor here, so that effects set in the script can be cleaned up if/when the
  // component is removed
  // And also so that we have an end node for the active range, if needed
  const compParentName = node.parentName!;
  const compAnchorName = node.varName!;
  b.append(`
    ${node.tagName}.render(${compParentName}, ${compAnchorName}, ${propsName}, ${slotsName}, $context)`);
}

function buildElementNode(
  node: ElementNode,
  status: BuildStatus,
  b: Builder,
  parentName: string,
  anchorName: string,
  root = false,
) {
  const varName = node.varName;
  if (varName) {
    // PERF: Does this have much of an impact??
    if (root) {
      b.append("");
      b.append(
        `t_apply_props(${varName}, $props, [${status.props.map((p) => `'${p}'`).join(", ")}]);`,
      );
    }
    buildElementAttributes(node, varName, status, b);
  }

  for (let child of node.children) {
    buildNode(child, status, b, parentName, "null");
  }
}

function buildElementAttributes(
  node: ElementNode,
  varName: string,
  status: BuildStatus,
  b: Builder,
) {
  for (let { name, value } of node.attributes) {
    if (name.startsWith("{") && name.endsWith("}")) {
      name = name.substring(1, name.length - 1);
      buildRun("setAttribute", `${varName}.setAttribute("${name}", ${name});`, status, b);

      const path = getFragmentPath(status, b);
      if (path) {
        buildRun("setAttribute", `${varName}.setAttribute("${name}", ${name});`, status, b);
      }
    } else if (name.startsWith("on")) {
      value = trimMatched(value, "{", "}");

      // Add an event listener
      const eventName = name.substring(2);

      const fragment = status.fragmentStack[status.fragmentStack.length - 1].fragment;
      if (fragment) {
        fragment.events.push({ varName, eventName, handler: value });
      }
    } else if (value.startsWith("{") && value.endsWith("}")) {
      value = value.substring(1, value.length - 1);

      if (name.indexOf("bind:") === 0) {
        // TODO: Don't love the bind: syntax -- $value? @value? :value?
        // Automatically add an event to bind the value
        // TODO: need to check the element to find out what type of event to add
        let eventName = "input";
        let defaultValue = '""';
        let typeAttribute = node.attributes.find((a) => a.name === "type");
        let inputValue = "e.target.value";
        if (typeAttribute) {
          if (trimQuotes(typeAttribute.value) === "number") {
            defaultValue = "0";
            inputValue = "Number(e.target.value)";
          }
        }
        let set = `${value} || ${defaultValue}`;
        const propName = name.substring(5);
        const setAttribute = `${varName}.setAttribute("${propName}", ${set})`;
        buildRun("setBinding", `${setAttribute};`, status, b);
        // TODO: Add a parseInput method that handles NaN etc
        b.append(`${varName}.addEventListener("${eventName}", (e) => ${value} = ${inputValue});`);
      } else if (name.indexOf("class:") === 0) {
        const propName = name.substring(6);
        const setAttribute = `${varName}.classList.toggle("${propName}", ${value})`;
        buildRun("setClassList", `${setAttribute};`, status, b);
      } else if (name === "class") {
        buildRun("setClassName", `${varName}.className = ${value};`, status, b);
      } else if (name.indexOf("data-") === 0) {
        // dataset seems to be a tiny bit slower?
        //const propName = name.substring(5);
        //buildRun("setDataAttribute", `${varName}.dataset.${propName} = ${value};`, status, b);
        buildRun("setDataAttribute", `${varName}.setAttribute("${name}", ${value});`, status, b);
      } else {
        buildRun("setAttribute", `${varName}.setAttribute("${name}", ${value});`, status, b);
      }
    }
  }
}

function buildScriptNode(node: ControlNode, b: Builder) {
  b.append(`/* ${node.operation} */`);
  b.append(`${maybeAppend(node.statement, ";")}`);
}

function isReactiveAttribute(name: string, value: string) {
  // HACK: Better checking of whether an attribute is reactive
  return (
    (name.startsWith("{") && name.endsWith("}")) ||
    (value.startsWith("{") && value.endsWith("}")) ||
    name.startsWith("on")
  );
}

function buildTextNode(
  node: TextNode,
  status: BuildStatus,
  b: Builder,
  parentName: string,
  anchorName: string,
) {
  let content = node.content || "";
  // Replace all spaces with a single space, both to save space and to remove newlines from generated JS strings
  content = content.replace(/\s+/g, " ");

  // TODO: Should be fancier about this in parse -- e.g. ignore braces in quotes, unclosed, etc
  let reactiveStarted = false;
  let reactiveCount = 0;
  for (let i = 0; i < content.length; i++) {
    if (content[i] === "{") {
      reactiveStarted = true;
    } else if (content[i] === "}") {
      if (reactiveStarted) {
        reactiveCount += 1;
        reactiveStarted = false;
      }
    }
  }

  if (reactiveCount) {
    if (reactiveCount === 1 && content.startsWith("{") && content.endsWith("}")) {
      content = `t_text(${content.substring(1, content.length - 1)})`;
    } else {
      content = `\`${content.replaceAll("{", "${t_text(").replaceAll("}", ")}")}\``;
    }
    buildRun("setTextContent", `${node.varName}.textContent = ${content};`, status, b);
  }
}

function getFragmentPath(status: BuildStatus, b: Builder): string {
  const fragment = status.fragmentStack[status.fragmentStack.length - 1];
  if (fragment && fragment.fragment) {
    //b.append(`console.log("${fragment.path}");`);
    //b.append(`//// t_fragment_${fragment.fragment.number} ${fragment.path}`);
    const parts = fragment.path.substring(0, fragment.path.length - 1).split("/");
    let path = `t_fragment_${fragment.fragment.number}`;
    let parentPath = "";
    let childIndex = -2;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].split(":")[1];
      if (part === "ch") {
        parentPath = path;
        if (childIndex != -2) {
          path += `.childNodes[${childIndex}]`;
        }
        childIndex = -1;
      } else {
        childIndex += 1;
      }
    }
    if (childIndex != -2) {
      parentPath = path;
      path += `.childNodes[${childIndex}]`;
    }

    return path;
  }

  return "";
}

function buildSpecialNode(
  node: ElementNode,
  status: BuildStatus,
  b: Builder,
  parentName: string,
  anchorName: string,
) {
  switch (node.tagName) {
    case ":slot": {
      buildSlotNode(node, status, b, parentName, anchorName);
    }
  }
  return "";
}

function buildSlotNode(
  node: ElementNode,
  status: BuildStatus,
  b: Builder,
  parentName: string,
  anchorName: string,
) {
  // If there's a slot, build that, otherwise build the default nodes
  let slotName = node.attributes.find((a) => a.name === "name")?.value;
  slotName = slotName ? trimQuotes(slotName) : "_";

  // Slot props
  const propsName = nextVarName("sprops", status);
  const slotAttributes = node.attributes.filter((a) => a.name !== "name");
  const slotHasProps = slotAttributes.length;
  if (slotHasProps) {
    // TODO: defaults etc props
    b.append(`const ${propsName} = $watch({});`);
    for (let { name, value } of slotAttributes) {
      if (name.startsWith("{") && name.endsWith("}")) {
        name = name.substring(1, name.length - 1);
        //b.append(`$run(() => ${propsName}["${name}"] = ${name});`);
        buildRun("setProp", `${propsName}["${name}"] = ${name});`, status, b);
      } else {
        let reactive = value.startsWith("{") && value.endsWith("}");
        if (reactive) {
          value = value.substring(1, value.length - 1);
        }
        const setProp = `${propsName}["${name}"] = ${value}`;
        //b.append(reactive ? `$run(() => ${setProp});` : `${setProp};`);
        if (reactive) {
          buildRun("setProp", `${setProp};`, status, b);
        } else {
          b.append(`${setProp};`);
        }
      }
    }
  }

  const slotParentName = node.parentName!;
  const slotAnchorName = node.varName!;

  b.append(`if ($slots && $slots["${slotName}"]) {`);
  b.append(
    `$slots["${slotName}"](${slotParentName}, ${slotAnchorName}, ${slotHasProps ? propsName : "undefined"})`,
  );

  // TODO: Not if there's only a single space node -- maybe check in parse
  if (node.children.length) {
    b.append(`} else {`);

    declareFragment(node, status, b);

    status.fragmentStack.push({
      fragment: node.fragment,
      path: "0:ch/",
    });
    for (let child of node.children) {
      buildNode(child, status, b, slotParentName, slotAnchorName);
    }
    status.fragmentStack.pop();

    addFragment(node, status, b, slotParentName, slotAnchorName);
  }

  b.append(`}`);
}

function buildRun(functionName: string, functionBody: string, status: BuildStatus, b: Builder) {
  b.append(`$run(function ${functionName}() {`);
  // If a value from a for loop is used in the function body, get it from the
  // loop data to trigger an update when it is changed
  // We could potentially directly replace using the regex? Might introduce issues though
  for (let varName of status.forVarNames) {
    if (new RegExp(`\\b${varName}\\b`).test(functionBody)) {
      b.append(`let ${varName} = t_item.data.${varName}; `);
    }
  }
  b.append(functionBody);
  b.append("});");
}

function nextVarName(name: string, status: BuildStatus): string {
  if (!status.varNames[name]) {
    status.varNames[name] = 1;
  }
  let varName = `t_${name}_${status.varNames[name]}`;
  status.varNames[name] += 1;
  return varName;
}

function isReactive(content: string) {
  // TODO: Need to be more fancy (check that braces match, ignore comments and strings etc)
  return content.includes("{") && content.includes("}");
}

function isFullyReactive(content: string) {
  // TODO: Need to be more fancy (check that braces match, ignore comments and strings etc)
  return content.trim().startsWith("{") && content.trim().endsWith("}");
}

function buildStyles(name: string, parts: ComponentParts): string {
  const b = new Builder();

  for (let block of parts.style!.blocks) {
    buildStyleBlock(block, b, parts.styleHash!);
  }

  return b.toString();
}

const globalStyleRegex = /\:global\((.+)\)/;

function buildStyleBlock(block: StyleBlock, b: Builder, styleHash: string) {
  // TODO: This should probably be done while parsing
  // And handle attribute selectors
  const selectors = block.selector
    .split(/([\s*,>+~])/)
    .filter((s) => !!s.trim())
    .map((s) => {
      if (s.length === 1 && "*,>+~".includes(s)) {
        return s;
      } else if (globalStyleRegex.test(s)) {
        return s.match(globalStyleRegex)![1];
      } else {
        return `${s}.tera-${styleHash}`;
      }
    });

  b.append(`${selectors.join(" ")} {`);
  for (let attribute of block.attributes) {
    buildStyleAttribute(attribute, b);
  }
  for (let child of block.children) {
    buildStyleBlock(child, b, styleHash);
  }
  b.append(`}`);
}

function buildStyleAttribute(attribute: Attribute, b: Builder) {
  b.append(`${attribute.name}: ${attribute.value};`);
}
