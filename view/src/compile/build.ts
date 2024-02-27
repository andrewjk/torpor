import BuildResult from "../types/BuildResult";
import ComponentParts from "../types/ComponentParts";
import Attribute from "../types/nodes/Attribute";
import ControlNode from "../types/nodes/ControlNode";
import ElementNode from "../types/nodes/ElementNode";
import Node from "../types/nodes/Node";
import TextNode from "../types/nodes/TextNode";
import StyleBlock from "../types/styles/StyleBlock";
import Builder from "./internal/Builder";
import { trimAny } from "./internal/utils";

interface BuildStatus {
  props: string[];
  styleHash: string;
  varNames: Record<string, number>;
  startNodeNames: StartNodeInfo[];
  lastNodeName: string;
}

interface StartNodeInfo {
  name: string;
  status: "unset" | "scoped" | "scopedset" | "set";
}

let b: Builder;
//let status: BuildStatus;

export default function build(name: string, parts: ComponentParts): BuildResult {
  const result: BuildResult = {
    code: buildCode(name, parts),
    styles: parts.style ? buildStyles(name, parts) : undefined,
    styleHash: parts.styleHash,
  };
  return result;
}

function buildCode(name: string, parts: ComponentParts): string {
  b = new Builder();

  const folder = "../../../../../tera/view/src";
  b.append(`import watch from '${folder}/watch/watch';`);
  b.append(`import watchEffect from '${folder}/watch/watchEffect';`);
  b.append(`import t_clear_range from '${folder}/render/internal/clearRange';`);
  b.append(`import t_reconcile_list from '${folder}/render/internal/reconcileList';`);
  b.append(`import t_apply_attributes from '${folder}/render/internal/applyAttributes';`);
  b.append(`import t_context from '${folder}/watch/internal/context';`);
  b.append(`import t_set_active_range from '${folder}/watch/internal/setActiveRange';`);
  //result +=
  //  "import { t_clear_range, t_reconcile_list, t_apply_attributes, watch, watchEffect } from '../../../../tera/view/dist/index.js';\n";
  if (parts.imports) {
    b.append(parts.imports.map((i) => `import ${i.name} from '${i.path}';`).join("\n"));
  }
  b.gap();

  // HACK: Move into utils
  b.append(`function t_text(text) { return text != null ? text : '' }`);
  //b.add(`function t_doc(node) { return node.ownerDocument }`);
  b.gap();

  b.append(`const ${name} = {`);
  b.indent();
  b.append(`name: "${name}",`);
  b.append(`/**`);
  b.append(` * @param {Node} $parent`);
  b.append(` * @param {Node | null} $anchor`);
  b.append(` * @param {Object} [$props]`);
  b.append(` * @param {Object} [$slots]`);
  b.append(` * @param {Object} [$context]`);
  b.append(` */`);
  b.append(`render: ($parent, $anchor, $props, $slots, $context) => {`);
  b.indent();

  // Redefine $context so that any newly added properties will only be passed to children
  if (parts.contexts?.length) {
    b.append(`$context = Object.assign({}, $context);`);
  }

  // Build an anchor here, so that effects set in the script can be cleaned up if/when the
  // component is removed
  b.append(`const t_component_anchor = document.createComment("@comp");`);
  b.append(`$parent.insertBefore(t_component_anchor, $anchor);`);
  b.append(`const t_original_active_range = t_context.activeRange;`);
  b.append(`t_set_active_range({ title: "@comp ${name}" });`);
  b.gap();

  if (parts.script) {
    // TODO: Mangling
    b.append("// USER SCRIPT");
    b.append(parts.script);
    b.gap();
  }

  if (parts.template) {
    // TODO:
    // We could create a document fragment with a string and assign the created elements to variables
    // It would mean we could use the same code for hydration too
    const status: BuildStatus = {
      props: parts.props || [],
      styleHash: parts.styleHash || "",
      varNames: {},
      startNodeNames: [],
      lastNodeName: "",
    };
    b.append("// USER INTERFACE");
    buildNode(parts.template, status, "$parent", "$anchor", true);
  }

  b.append(`t_context.activeRange = t_original_active_range;`);
  b.outdent();
  b.append(`}`);
  b.outdent();
  b.append(`}`);
  b.gap();
  b.append(`export default ${name};`);

  return b.result;
}

function buildNode(
  node: Node,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
  root = false,
) {
  switch (node.type) {
    case "control": {
      buildControlNode(node as ControlNode, status, parentName, anchorName);
      break;
    }
    case "component": {
      buildComponentNode(node as ElementNode, status, parentName, anchorName, root);
      break;
    }
    case "element": {
      buildElementNode(node as ElementNode, status, parentName, anchorName, root);
      break;
    }
    case "text": {
      buildTextNode(node as TextNode, status, parentName, anchorName);
      break;
    }
    case "special": {
      buildSpecialNode(node as ElementNode, status, parentName, anchorName);
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
  parentName: string,
  anchorName: string,
) {
  switch (node.operation) {
    case "@const": {
      b.append(`${node.statement}${node.statement.endsWith(";") ? "" : ";"}`);
      break;
    }
    case "@if group": {
      buildIfNode(node, status, parentName, anchorName);
      break;
    }
    case "@if":
    case "@else if":
    case "@else": {
      // These get handled with @if group, above
      break;
    }
    case "@switch": {
      buildSwitchNode(node, status, parentName, anchorName);
    }
    case "@case": {
      // This gets handled with @switch, above
      break;
    }
    case "@for": {
      buildForNode(node, status, parentName, anchorName);
      break;
    }
    case "@await group": {
      buildAwaitNode(node, status, parentName, anchorName);
      break;
    }
    case "@then":
    case "@catch": {
      // These get handled with @await group, above
      break;
    }
    default: {
      throw new Error(`Invalid operation: ${node.operation}`);
    }
  }
}

function buildIfNode(
  node: ControlNode,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
) {
  const ifAnchorName = nextVarName("if_anchor", status);
  const ifIndexName = nextVarName("if_index", status);
  const oldRangeName = nextVarName("old_range", status);
  const ifRangeName = nextVarName("if_range", status);
  const ifBranchRangesName = nextVarName("if_branch_ranges", status);

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

  b.gap();
  b.append(`// IF`);
  b.append(`const ${ifAnchorName} = document.createComment("@if");`);
  b.append(`${parentName}.insertBefore(${ifAnchorName}, ${anchorName});`);
  b.gap();
  b.append(`let ${ifIndexName} = -1;`);
  b.append(`let ${ifRangeName} = { title: "@if ${branches[0].statement}" };`);
  b.append(
    `let ${ifBranchRangesName} = [${branches.map((x) => `{ title: '@branch ${x.statement}' }`).join(", ")}]`,
  );
  b.gap();
  b.append(`const ${oldRangeName} = t_context.activeRange;`);
  b.append(`t_set_active_range(${ifRangeName});`);
  b.gap();
  b.append(`watchEffect(() => {`);
  b.indent();
  b.append(`t_context.activeRange = ${ifRangeName};`);

  for (let [i, branch] of branches.entries()) {
    status.startNodeNames.push({ name: `${ifBranchRangesName}[${i}].startNode`, status: "unset" });
    buildIfBranch(branch, status, parentName, ifAnchorName, ifBranchRangesName, ifIndexName, i);
    status.startNodeNames.pop();
  }

  b.outdent();
  b.append(`});`);
  b.append(`t_context.activeRange = ${oldRangeName};`);
  b.gap();
}

function buildIfBranch(
  node: ControlNode,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
  branchRangesName: string,
  indexName: string,
  index: number,
) {
  const startNodeNames = scopeNodeNames(status);

  const branchRangeName = `${branchRangesName}[${index}]`;

  b.append(`${node.statement} {`);
  b.indent();
  b.append(`if (${indexName} === ${index}) return;`);
  b.append(`if (${indexName} !== -1) t_clear_range(${branchRangesName}[${indexName}]);`);
  b.gap();
  b.append(`const t_old_range = t_context.activeRange;`);
  b.append(`t_set_active_range(${branchRangeName});`);
  b.gap();
  status.lastNodeName = "";
  for (let child of filterChildren(node)) {
    buildNode(child, status, parentName, anchorName);
  }
  b.gap();
  b.append(`${indexName} = ${index};`);
  if (status.lastNodeName) {
    // TODO: get the last node name (element or text) that has the same parent
    b.append(`${branchRangeName}.endNode = ${status.lastNodeName};`);
  }
  b.append(`t_context.activeRange = t_old_range;`);
  b.outdent();
  b.append(`}`);

  unscopeNodeNames(status, startNodeNames);
}

function buildSwitchNode(
  node: ControlNode,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
) {
  const switchAnchorName = nextVarName("switch_anchor", status);
  const switchIndexName = nextVarName("switch_index", status);
  const oldRangeName = nextVarName("old_range", status);
  const switchRangeName = nextVarName("switch_range", status);
  const switchBranchRangesName = nextVarName("switch_branch_ranges", status);

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

  b.gap();
  b.append(`// SWITCH`);
  b.append(`const ${switchAnchorName} = document.createComment("@switch");`);
  b.append(`${parentName}.insertBefore(${switchAnchorName}, ${anchorName});`);
  b.gap();
  b.append(`let ${switchIndexName} = -1;`);
  b.append(`let ${switchRangeName} = { title: "@switch ${node.statement}" };`);
  b.append(
    `let ${switchBranchRangesName} = [${branches.map((x) => `{ title: '@branch ${x.statement}' }`).join(", ")}]`,
  );
  b.gap();
  b.append(`const ${oldRangeName} = t_context.activeRange;`);
  b.append(`t_set_active_range(${switchRangeName});`);
  b.gap();
  b.append(`watchEffect(() => {`);
  b.indent();
  b.append(`t_context.activeRange = ${switchRangeName};`);
  b.append(`${node.statement} {`);
  b.indent();

  for (let [i, branch] of branches.entries()) {
    status.startNodeNames.push({
      name: `${switchBranchRangesName}[${i}].startNode`,
      status: "unset",
    });
    buildSwitchBranch(
      branch as ControlNode,
      status,
      parentName,
      switchAnchorName,
      switchBranchRangesName,
      switchIndexName,
      i,
    );
    status.startNodeNames.pop();
  }

  b.outdent();
  b.append(`}`);
  b.outdent();
  b.append(`});`);
  b.append(`t_context.activeRange = ${oldRangeName};`);
  b.gap();
}

function buildSwitchBranch(
  node: ControlNode,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
  branchRangesName: string,
  indexName: string,
  index: number,
) {
  const startNodeNames = scopeNodeNames(status);

  const branchRangeName = `${branchRangesName}[${index}]`;

  b.append(`${node.statement} {`);
  b.indent();
  b.append(`if (${indexName} === ${index}) return;`);
  b.append(`if (${indexName} !== -1) t_clear_range(${branchRangesName}[${indexName}]);`);
  b.gap();
  b.append(`const t_old_range = t_context.activeRange;`);
  b.append(`t_set_active_range(${branchRangeName});`);
  b.gap();
  status.lastNodeName = "";
  for (let child of filterChildren(node)) {
    buildNode(child, status, parentName, anchorName);
  }
  b.gap();
  b.append(`${indexName} = ${index};`);
  if (status.lastNodeName) {
    b.append(`${branchRangeName}.endNode = ${status.lastNodeName};`);
  }
  b.append(`t_context.activeRange = t_old_range;`);
  b.append(`break;`);
  b.outdent();
  b.append(`}`);

  unscopeNodeNames(status, startNodeNames);
}

const forLoopRegex = /for\s*\((.+?);.*?;.*?\)/;
const forLoopVarsRegex = /(?:let\s+|var\s+){0,1}([^\s,;+=]+)(?:\s*=\s*[^,;]+){0,1}/g;
const forOfRegex = /for\s*\(\s*(?:let\s*|var\s*){0,1}(.+?)\s+(?:of|in).*?\)/;

function buildForNode(
  node: ControlNode,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
) {
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
          ...trimAny(match, "{}[]")
            .split(",")
            .map((m) => m.trim()),
        );
      } else {
        forVarNames.push(match);
      }
    }
  }

  const forAnchorName = nextVarName("for_anchor", status);
  const oldRangeName = nextVarName("old_range", status);
  const forRangeName = nextVarName("for_range", status);
  const forItemsName = nextVarName("for_items", status);

  // Get the key node if it's been set
  const key = node.children.find(
    (n) => n.type === "control" && (n as ControlNode).operation === "@key",
  );

  b.gap();
  b.append(`// FOR`);
  b.append(`const ${forAnchorName} = document.createComment("@for");`);
  b.append(`${parentName}.insertBefore(${forAnchorName}, ${anchorName});`);
  b.gap();
  b.append(`let ${forItemsName} = [];`);
  b.append(`let ${forRangeName} = { title: "@for ${node.statement}" };`);
  b.gap();
  b.append(`const ${oldRangeName} = t_context.activeRange;`);
  b.append(`t_set_active_range(${forRangeName});`);
  b.gap();
  b.append(`watchEffect(() => {`);
  b.indent();
  b.append(`t_context.activeRange = ${forRangeName};`);
  b.append(`let t_for_items = [];`);
  b.append(`${node.statement} {`);
  b.indent();
  // TODO: Because we're accessing item properties out here, they get attached to the @for anchor and don't get cleaned up
  // Somehow we need to attach them to the appropriate @foritem anchor instead
  b.append(`let t_item = {};`);
  if (key) {
    const keyStatement = (key as ControlNode).statement;
    b.append(`t_item.key = ${keyStatement.substring(keyStatement.indexOf("=") + 1).trim()};`);
  }
  b.append(`t_item.data = {};`);
  for (let v of forVarNames) {
    b.append(`t_item.data["${v}"] = ${v};`);
  }
  b.append(`t_for_items.push(t_item);`);
  b.outdent();
  b.append(`}`);
  b.gap();
  b.append(`t_reconcile_list(`);
  b.indent();
  b.append(`${parentName},`);
  b.append(`${forItemsName},`);
  b.append(`t_for_items,`);
  b.append(`(t_parent, t_item, t_before) => {`);
  b.indent();
  b.append(`let { ${forVarNames.join(", ")} } = t_item.data;`);
  b.gap();
  status.startNodeNames.push({ name: `t_item.startNode`, status: "unset" });
  buildForItem(node, status, "t_parent");
  status.startNodeNames.pop();
  b.outdent();
  b.append(`}`);
  b.outdent();
  b.append(`);`);
  b.gap();
  b.append(`${forItemsName} = t_for_items;`);
  b.outdent();
  b.append(`});`);
  b.append(`t_context.activeRange = ${oldRangeName};`);
  b.gap();
}

function buildForItem(node: ControlNode, status: BuildStatus, parentName: string) {
  b.append(`const t_old_range = t_context.activeRange;`);
  b.append(`t_set_active_range(t_item);`);
  b.gap();
  status.lastNodeName = "";
  for (let child of filterChildren(node)) {
    if (child.type === "control" && (child as ControlNode).operation === "@key") {
      continue;
    }
    buildNode(child, status, parentName, "t_before");
  }
  b.gap();
  if (status.lastNodeName) {
    // TODO: get the last node name (element or text) that has the same parent
    b.append(`t_item.endNode = ${status.lastNodeName};`);
  }
  b.append(`t_context.activeRange = t_old_range;`);
}

function buildAwaitNode(
  node: ControlNode,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
) {
  // TODO: Would this all be better as a component?

  const awaitAnchorName = nextVarName("await_anchor", status);
  const awaitTokenName = nextVarName("await_token", status);
  const awaitIndexName = nextVarName("await_index", status);
  const oldRangeName = nextVarName("old_range", status);
  const awaitRangeName = nextVarName("await_range", status);
  const awaitBranchRangesName = nextVarName("await_branch_ranges", status);

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

  const awaiterName = trim(awaitBranch.statement.substring("await".length), "(", ")");
  const thenVar = trim(thenBranch.statement.substring("then".length), "(", ")");
  const catchVar = trim(catchBranch.statement.substring("catch".length), "(", ")");

  b.gap();
  b.append(`// AWAIT`);
  b.append(`const ${awaitAnchorName} = document.createComment("@await");`);
  b.append(`${parentName}.insertBefore(${awaitAnchorName}, ${anchorName});`);
  b.gap();
  // Use an incrementing token to make sure only the last request gets handled
  // TODO: This might have unforeseen consequences
  b.append(`let ${awaitTokenName} = 0;`);
  b.append(`let ${awaitIndexName} = -1;`);
  b.append(`let ${awaitRangeName} = { title: "@await ${branches[0].statement}" };`);
  b.append(
    `let ${awaitBranchRangesName} = [${branches.map((x) => `{ title: '@branch ${x.statement}' }`).join(", ")}]`,
  );
  b.gap();
  b.append(`const ${oldRangeName} = t_context.activeRange;`);
  b.append(`t_set_active_range(${awaitRangeName});`);
  b.gap();
  b.append(`watchEffect(() => {`);
  b.indent();
  b.append(`${awaitTokenName}++;`);
  b.append(`t_context.activeRange = ${awaitRangeName};`);
  b.gap();

  status.startNodeNames.push({ name: `${awaitBranchRangesName}[0].startNode`, status: "unset" });
  buildAwaitBranch(
    awaitBranch,
    status,
    parentName,
    awaitAnchorName,
    awaitBranchRangesName,
    awaitIndexName,
    0,
  );
  status.startNodeNames.pop();

  b.gap();
  b.append(`((token) => {`);
  b.indent();
  b.append(awaiterName);
  b.indent();
  b.append(`.then((${thenVar}) => {`);
  b.indent();
  b.append(`if (token === ${awaitTokenName}) {`);
  b.indent();

  status.startNodeNames.push({ name: `${awaitBranchRangesName}[1].startNode`, status: "unset" });
  buildAwaitBranch(
    thenBranch,
    status,
    parentName,
    awaitAnchorName,
    awaitBranchRangesName,
    awaitIndexName,
    1,
  );
  status.startNodeNames.pop();

  b.outdent();
  b.append(`}`);
  b.outdent();
  b.append(`})`);
  b.append(`.catch((${catchVar}) => {`);
  b.indent();
  b.append(`if (token === ${awaitTokenName}) {`);

  status.startNodeNames.push({ name: `${awaitBranchRangesName}[2].startNode`, status: "unset" });
  buildAwaitBranch(
    catchBranch,
    status,
    parentName,
    awaitAnchorName,
    awaitBranchRangesName,
    awaitIndexName,
    2,
  );
  status.startNodeNames.pop();

  b.outdent();
  b.append(`}`);
  b.outdent();
  b.append(`});`);
  b.outdent();
  b.append(`})(${awaitTokenName});`);
  b.outdent();
  b.append(`});`);
  b.append(`t_context.activeRange = ${oldRangeName};`);
  b.gap();
}

function buildAwaitBranch(
  node: ControlNode,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
  branchRangesName: string,
  indexName: string,
  index: number,
) {
  const startNodeNames = scopeNodeNames(status);

  const branchRangeName = `${branchRangesName}[${index}]`;

  b.append(`if (${indexName} !== -1) t_clear_range(${branchRangesName}[${indexName}]);`);
  b.gap();
  b.append(`const t_old_range = t_context.activeRange;`);
  b.append(`t_set_active_range(${branchRangeName});`);
  b.gap();
  status.lastNodeName = "";
  for (let child of filterChildren(node)) {
    buildNode(child, status, parentName, anchorName);
  }
  b.gap();
  b.append(`${indexName} = ${index};`);
  if (status.lastNodeName) {
    b.append(`${branchRangeName}.endNode = ${status.lastNodeName};`);
  }
  b.append(`t_context.activeRange = t_old_range;`);

  unscopeNodeNames(status, startNodeNames);
}

function buildComponentNode(
  node: ElementNode,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
  root = false,
) {
  // Props
  const propsName = nextVarName("props", status);
  const componentHasProps = node.attributes.length || root;
  if (componentHasProps) {
    // TODO: defaults etc props
    b.append(`const ${propsName} = watch({});`);
    for (let { name, value } of node.attributes) {
      if (name.startsWith("{") && name.endsWith("}")) {
        name = name.substring(1, name.length - 1);
        b.append(`watchEffect(() => ${propsName}["${name}"] = ${name});`);
      } else {
        let generated = value.startsWith("{") && value.endsWith("}");
        if (generated) {
          value = value.substring(1, value.length - 1);
        }
        if (name === "class") {
          // TODO: How to handle dynamic classes etc
          // Probably just compile down to a string?
          value = `"${trimAny(value, `'"`)} tera-${status.styleHash}"`;
        }
        const setProp = `${propsName}["${name}"] = ${value || "true"}`;
        b.append(generated ? `watchEffect(() => ${setProp});` : `${setProp};`);
      }
    }
    // PERF: Does this have much of an impact??
    if (root) {
      b.append(`if ($props) {`);
      b.indent();
      b.append(`const propNames = [${status.props.map((p) => `'${p}'`).join(", ")}];`);
      b.append(`for (let name of Object.keys($props)) {`);
      b.indent();
      b.append(`if (!name.startsWith("$") && !propNames.includes(name)) {`);
      b.indent();
      b.append(`watchEffect(() => ${propsName}[name] = $props[name]);`);
      b.outdent();
      b.append(`}`);
      b.outdent();
      b.append(`}`);
      b.outdent();
      b.append(`}`);
    }
  }

  // Slots
  const slotsName = nextVarName("slots", status);
  const componentHasSlots = node.children.length;
  if (componentHasSlots) {
    const slots = gatherSlotNodes(node);
    b.append(`const ${slotsName} = {};`);
    for (let [key, value] of Object.entries(slots)) {
      b.append(`${slotsName}["${key}"] = ($parent, $anchor, $sprops) => {`);
      b.indent();
      for (let child of filterChildren(value)) {
        buildNode(child, status, "$parent", "$anchor");
      }
      b.outdent();
      b.append(`}`);
    }
  }

  // Call the component's render function
  b.append(
    `${node.tagName}.render(${parentName}, ${anchorName}, ${componentHasProps ? propsName : "undefined"}, ${componentHasSlots ? slotsName : "undefined"}, $context)`,
  );
}

function gatherSlotNodes(node: ElementNode): Record<string, Node[]> {
  const slots: Record<string, Node[]> = {};

  // Add named slots
  for (let child of node.children) {
    if (child.type === "special") {
      const el = child as ElementNode;
      if (el.tagName === ":fill") {
        let slotName = el.attributes.find((a) => a.name === "name")?.value;
        if (slotName) slotName = trimAny(slotName, `'"`);
        slots[slotName || "_"] = el.children;
      }
    }
  }

  // Add the default slot, if not already done
  // TODO: Check that this excludes spaces etc
  if (!slots["_"]) {
    const children: Node[] = [];
    for (let child of filterChildren(node)) {
      if (child.type === "special" && (child as ElementNode).tagName === ":fill") {
        continue;
      }
      children.push(child);
    }
    if (children.length) {
      slots["_"] = children;
    }
  }

  return slots;
}

function buildElementNode(
  node: ElementNode,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
  root = false,
) {
  const varName = nextVarName(node.tagName, status);

  b.append(`const ${varName} = document.createElement("${node.tagName}");`);
  // PERF: Does this have much of an impact??
  if (root) {
    b.append(`if ($props) {`);
    b.indent();
    b.append(`const propNames = [${status.props.map((p) => `'${p}'`).join(", ")}];`);
    b.append(`t_apply_attributes(${varName}, $props, propNames);`);
    b.outdent();
    b.append(`}`);
  }
  buildElementAttributes(node, varName, status);
  for (let child of filterChildren(node)) {
    buildNode(child, status, varName, "null");
  }
  b.append(`${parentName}.insertBefore(${varName}, ${anchorName});`);

  // TODO: Do this for text nodes too
  setScopedNodes(status, varName);
}

function buildElementAttributes(node: ElementNode, varName: string, status: BuildStatus) {
  for (let attribute of node.attributes) {
    let { name, value } = attribute;
    if (name.startsWith("{") && name.endsWith("}")) {
      name = name.substring(1, name.length - 1);
      b.append(`watchEffect(() => ${varName}.setAttribute("${name}", ${name}));`);
    } else {
      let generated = value.startsWith("{") && value.endsWith("}");
      if (generated) {
        value = value.substring(1, value.length - 1);
      }

      if (name.indexOf("on") === 0) {
        // Add an event listener
        const eventName = name.substring(2);
        b.append(`${varName}.addEventListener("${eventName}", ${value});`);
      } else if (name.indexOf("bind:") === 0) {
        // TODO: Don't love the bind: syntax -- $value? @value? :value?
        // Automatically add an event to bind the value
        // TODO: need to check the element to find out what type of event to add
        let eventName = "input";
        let defaultValue = '""';
        let typeAttribute = node.attributes.find((a) => a.name === "type");
        let inputValue = "e.target.value";
        if (typeAttribute) {
          if (trimAny(typeAttribute.value, `'"`) === "number") {
            defaultValue = "0";
            inputValue = "Number(e.target.value)";
          }
        }
        let set = `${value} || ${defaultValue}`;
        const propName = name.substring(5);
        const setAttribute = `${varName}.setAttribute("${propName}", ${set})`;
        b.append(generated ? `watchEffect(() => ${setAttribute});` : `${setAttribute};`);
        // TODO: Add a parseInput method that handles NaN etc
        b.append(`${varName}.addEventListener("${eventName}", (e) => ${value} = ${inputValue});`);
      } else if (name.indexOf("class:") === 0) {
        const propName = name.substring(6);
        const setAttribute = `${varName}.classList.toggle("${propName}", ${value})`;
        b.append(generated ? `watchEffect(() => ${setAttribute});` : `${setAttribute};`);
      } else if (name === "class") {
        // NOTE: Clear any previously set values from the element
        const classVarName = nextVarName("class_name", status);
        if (generated) {
          b.append(`let ${classVarName} = ${value};`);
          b.append(`watchEffect(() => {`);
          b.indent();
          b.append(`if (${classVarName}) ${varName}.classList.remove(${classVarName});`);
          b.append(`if (${value}) {`);
          b.indent();
        }
        b.append(`${varName}.classList.add(...${value}.split(" "));`);
        if (generated) {
          b.append(`${classVarName} = ${value};`);
          b.outdent();
          b.append(`}`);
          b.outdent();
          b.append(`});`);
        }
      } else {
        // Set the attribute value
        const setAttribute = `${varName}.setAttribute("${name}", ${value})`;
        b.append(generated ? `watchEffect(() => ${setAttribute});` : `${setAttribute};`);
      }
    }
  }
}

function buildTextNode(
  node: TextNode,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
) {
  let content = node.content || "";
  // Replace all spaces with a single space, both to save space and to remove newlines from generated JS strings
  content = content.replace(/\s+/g, " ");

  // TODO: Should be fancier about this in parse -- e.g. ignore braces in quotes, unclosed, etc
  let generated = content.includes("{") && content.includes("}");
  let generatedCount = 0;
  let braceCount = 0;
  for (let i = 0; i < content.length; i++) {
    if (content[i] === "{") {
      generated = true;
      braceCount += 1;
      if (braceCount === 0) {
        generatedCount += 1;
      }
    } else if (content[i] === "}") {
      braceCount -= 1;
    }
  }
  if (generated) {
    if (generatedCount === 1 && content.startsWith("{") && content.endsWith("}")) {
      content = content.substring(1, content.length - 1);
    } else {
      content = `\`${content.replaceAll("{", "${t_text(").replaceAll("}", ")}")}\``;
    }
  } else {
    content = `t_text("${content.replaceAll('"', '\\"')}")`;
  }

  const varName = nextVarName("text", status);
  b.append(`const ${varName} = document.createTextNode(${generated ? '""' : content});`);
  b.append(`${parentName}.insertBefore(${varName}, ${anchorName});`);

  if (generated) {
    b.append(`watchEffect(() => ${varName}.textContent = ${content});`);
  }

  //result += setScopedNodes(status, varName);
}

function buildSpecialNode(
  node: ElementNode,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
) {
  switch (node.tagName) {
    case ":slot": {
      buildSlotNode(node, status, parentName, anchorName);
    }
  }
  return "";
}

function buildSlotNode(
  node: ElementNode,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
) {
  // If there's a slot, build that, otherwise build the default nodes
  let slotName = node.attributes.find((a) => a.name === "name")?.value;
  if (slotName) {
    slotName = trimAny(slotName, `'"`);
  } else {
    slotName = "_";
  }

  // Slot props
  const propsName = nextVarName("sprops", status);
  const slotAttributes = node.attributes.filter((a) => a.name !== "name");
  const slotHasProps = slotAttributes.length;
  if (slotHasProps) {
    // TODO: defaults etc props
    b.append(`const ${propsName} = watch({});`);
    for (let { name, value } of slotAttributes) {
      if (name.startsWith("{") && name.endsWith("}")) {
        name = name.substring(1, name.length - 1);
        b.append(`watchEffect(() => ${propsName}["${name}"] = ${name});`);
      } else {
        let generated = value.startsWith("{") && value.endsWith("}");
        if (generated) {
          value = value.substring(1, value.length - 1);
        }
        const setProp = `${propsName}["${name}"] = ${value}`;
        b.append(generated ? `watchEffect(() => ${setProp});` : `${setProp};`);
      }
    }
  }

  b.append(`if ($slots && $slots["${slotName}"]) {`);
  b.indent();
  b.append(
    `$slots["${slotName}"](${parentName}, ${anchorName}, ${slotHasProps ? propsName : "undefined"})`,
  );
  b.outdent();
  b.append(`} else {`);
  b.indent();
  for (let child of filterChildren(node)) {
    buildNode(child, status, parentName, anchorName);
  }
  b.outdent();
  b.append(`}`);
}

function* filterChildren(node: ElementNode | ControlNode | Node[]) {
  const children = Array.isArray(node) ? node : node.children;
  const endIndex = children.length - 1;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];

    // Skip the first and last spaces
    if ((i === 0 || i === endIndex) && child.type === "space") {
      continue;
    }

    // Merge text and spaces
    if (child.type === "text" || child.type === "space") {
      const joinedChild: TextNode = {
        type: "text",
        content: (child as TextNode).content || "",
      };
      for (i = i + 1; i < children.length; i++) {
        const nextChild = children[i];

        // Skip the first and last spaces
        if ((i === 0 || i === endIndex) && nextChild.type === "space") {
          continue;
        }

        if (nextChild.type === "text" || nextChild.type === "space") {
          joinedChild.content += (nextChild as TextNode).content;
        } else {
          i--;
          break;
        }
      }

      yield joinedChild;
    } else {
      yield child;
    }
  }
}

/*
function processChildren(node: ElementNode | ControlNode, cb: (node: Node) => void) {
  const endIndex = node.children.length - 1;
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];

    // Skip the first and last spaces
    if ((i === 0 || i === endIndex) && child.type === "space") {
      continue;
    }

    // Merge text and spaces
    if (child.type === "text" || child.type === "space") {
      const joinedChild: TextNode = {
        type: "text",
        content: (child as TextNode).content || "",
      };

      for (i = i + 1; i < node.children.length; i++) {
        const nextChild = node.children[i];

        // Skip the first and last spaces
        if ((i === 0 || i === endIndex) && nextChild.type === "space") {
          continue;
        }

        if (nextChild.type === "text" || nextChild.type === "space") {
          joinedChild.content += (nextChild as TextNode).content;
        } else {
          i--;
          break;
        }
      }

      cb(joinedChild);
    } else {
      cb(child);
    }
  }
}
*/

function nextVarName(name: string, status: BuildStatus): string {
  if (!status.varNames[name]) {
    status.varNames[name] = 1;
  }
  let varName = `t_${name}_${status.varNames[name]}`;
  status.varNames[name] += 1;
  return varName;
}

function scopeNodeNames(status: BuildStatus) {
  // Set all start node names that haven't been set yet to branch
  // They will get set in the current scope, and the next scope(s), and maybe outside the scopes
  const copy = status.startNodeNames.map((n) => ({ name: n.name, status: n.status }));
  status.startNodeNames.forEach((n) => {
    if (n.status === "unset") {
      n.status = "scoped";
    }
  });
  return copy;
}

function unscopeNodeNames(status: BuildStatus, copy: StartNodeInfo[]) {
  // Set all start node names that have been branch back to unset so they can get set in the next
  // scope(s), and maybe outside the scopes
  //status.startNodeNames.forEach((n) => {
  //  if (n.status === "scoped") {
  //    n.status = "unset";
  //  }
  //});
  status.startNodeNames = copy;

  // We can't use any nodes created in this scope from outside it
  status.lastNodeName = "";
}

function setScopedNodes(status: BuildStatus, varName: string) {
  for (let startNodeName of status.startNodeNames) {
    if (startNodeName.status === "unset") {
      b.append(`if (!${startNodeName.name}) ${startNodeName.name} = ${varName};`);
      startNodeName.status = "set";
    } else if (startNodeName.status === "scoped") {
      b.append(`${startNodeName.name} = ${varName};`);
      startNodeName.status = "scopedset";
    }
  }

  status.lastNodeName = varName;
}

function buildStyles(name: string, parts: ComponentParts): string {
  b = new Builder();

  for (let block of parts.style!.blocks) {
    buildStyleBlock(block, parts.styleHash!);
  }

  return b.result;
}

const globalStyleRegex = /\:global\((.+)\)/;

function buildStyleBlock(block: StyleBlock, styleHash: string) {
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
    buildStyleAttribute(attribute);
  }
  for (let child of block.children) {
    buildStyleBlock(child, styleHash);
  }
  b.append(`}`);
}

function buildStyleAttribute(attribute: Attribute): string {
  return `${attribute.name}: ${attribute.value};\n`;
}

function trim(text: string, startValue: string, endValue: string) {
  text = text.trim();
  if (text.startsWith(startValue)) {
    text = text.substring(startValue.length);
  }
  if (text.endsWith(endValue)) {
    text = text.substring(0, text.length - endValue.length);
  }
  return text;
}
