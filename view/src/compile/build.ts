import BuildResult from "../types/BuildResult";
import ComponentParts from "../types/ComponentParts";
import Attribute from "../types/nodes/Attribute";
import ControlNode from "../types/nodes/ControlNode";
import ElementNode from "../types/nodes/ElementNode";
import Node from "../types/nodes/Node";
import TextNode from "../types/nodes/TextNode";
import StyleBlock from "../types/styles/StyleBlock";
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
  // TODO: scopedset
  status: "unset" | "scoped" | "scopedset" | "set";
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
  let result = "";

  const folder = "../../../../../tera/view/src";
  result += `import watch from '${folder}/watch/watch';\n`;
  result += `import watchEffect from '${folder}/watch/watchEffect';\n`;
  result += `import t_clear_range from '${folder}/render/internal/clearRange';\n`;
  result += `import t_reconcile_list from '${folder}/render/internal/reconcileList';\n`;
  result += `import t_apply_attributes from '${folder}/render/internal/applyAttributes';\n`;
  result += `import t_context from '${folder}/watch/internal/context';\n`;
  result += `import t_set_active_range from '${folder}/watch/internal/setActiveRange';\n`;
  //result +=
  //  "import { t_clear_range, t_reconcile_list, t_apply_attributes, watch, watchEffect } from '../../../../tera/view/dist/index.js';\n";
  if (parts.imports) {
    result += parts.imports.map((i) => `import ${i.name} from '${i.path}';`).join("\n") + "\n";
  }
  result += "\n";

  // HACK: Move into utils
  result += "function t_text(text) { return text != null ? text : '' }\n";
  //result += "function t_doc(node) { return node.ownerDocument }\n";
  result += "\n";

  result += `const ${name} = {\n`;
  result += `name: "${name}",\n`;
  result += `/**\n`;
  result += ` * @param {Node} $parent\n`;
  result += ` * @param {Node | null} $anchor\n`;
  result += ` * @param {Object} [$props]\n`;
  result += ` * @param {Object} [$slots]\n`;
  result += ` * @param {Object} [$context]\n`;
  result += ` */\n`;
  result += `render: ($parent, $anchor, $props, $slots, $context) => {\n`;

  // Redefine $context so that any newly added properties will only be passed to children
  // TODO: Only if there's a mention of $context in here??
  result += `$context = Object.assign({}, $context);\n`;

  // Build an anchor here, so that effects set in the script can be cleaned up if/when the
  // component is removed
  result += `const t_component_anchor = document.createComment("@comp");\n`;
  result += `$parent.insertBefore(t_component_anchor, $anchor);\n`;
  result += `const t_original_active_range = t_context.activeRange;\n`;
  result += `t_set_active_range({ title: "@comp ${name}" });\n`;

  if (parts.script) {
    // TODO: Mangling
    result += parts.script;
    result += "\n\n";
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
    result += buildNode(parts.template, status, "$parent", "$anchor", true);
  }

  result += `t_context.activeRange = t_original_active_range;\n`;
  result += `}\n`;
  result += `};\n\n`;
  result += `export default ${name};`;

  return result;
}

function buildNode(
  node: Node,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
  root = false,
): string {
  switch (node.type) {
    case "control": {
      return buildControlNode(node as ControlNode, status, parentName, anchorName);
    }
    case "component": {
      return buildComponentNode(node as ElementNode, status, parentName, anchorName, root);
    }
    case "element": {
      return buildElementNode(node as ElementNode, status, parentName, anchorName, root);
    }
    case "text": {
      return buildTextNode(node as TextNode, status, parentName, anchorName);
    }
    case "special": {
      return buildSpecialNode(node as ElementNode, status, parentName, anchorName);
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
): string {
  switch (node.operation) {
    case "@const": {
      return node.statement + (!node.statement.endsWith(";") ? ";" : "");
    }
    case "@if group": {
      return buildIfNode(node, status, parentName, anchorName);
    }
    case "@if":
    case "@else if":
    case "@else": {
      // These get handled with @if group, above
      return "";
    }
    case "@switch": {
      return buildSwitchNode(node, status, parentName, anchorName);
    }
    case "@case": {
      // This gets handled with @switch, above
      return "";
    }
    case "@for": {
      return buildForNode(node, status, parentName, anchorName);
    }
    case "@await group": {
      return buildAwaitNode(node, status, parentName, anchorName);
    }
    case "@then":
    case "@catch": {
      // These get handled with @await group, above
      return "";
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
): string {
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

  let result = "";
  result += "\n";
  result += "//\n";
  result += "// === IF ===\n";
  result += "//\n";
  result += `const ${ifAnchorName} = document.createComment("@if");\n`;
  result += `${parentName}.insertBefore(${ifAnchorName}, ${anchorName});\n`;
  result += "\n";
  result += `let ${ifIndexName} = -1;\n`;
  result += `let ${ifRangeName} = { title: "@if ${branches[0].statement}" };\n`;
  result += `let ${ifBranchRangesName} = [${branches.map((x) => `{ title: '@branch ${x.statement}' }`).join(", ")}];\n`;
  result += "\n";
  result += `const ${oldRangeName} = t_context.activeRange;\n`;
  result += `t_set_active_range(${ifRangeName});\n`;
  result += "\n";
  result += `watchEffect(() => {\n`;
  result += `t_context.activeRange = ${ifRangeName};\n`;

  for (let [i, branch] of branches.entries()) {
    status.startNodeNames.push({ name: `${ifBranchRangesName}[${i}].startNode`, status: "unset" });
    result += buildIfBranch(
      branch,
      status,
      parentName,
      ifAnchorName,
      ifBranchRangesName,
      ifIndexName,
      i,
    );
    status.startNodeNames.pop();
  }

  result += "});\n";
  result += `t_context.activeRange = ${oldRangeName};\n\n`;

  return result;
}

function buildIfBranch(
  node: ControlNode,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
  branchRangesName: string,
  indexName: string,
  index: number,
): string {
  const startNodeNames = scopeNodeNames(status);

  const branchRangeName = `${branchRangesName}[${index}]`;

  let result = "";
  result += "\n";
  result += "//\n";
  result += "// === IF BRANCH ===\n";
  result += "//\n";
  result += `${node.statement} {\n`;
  result += `if (${indexName} === ${index}) return;\n`;
  result += `if (${indexName} !== -1) t_clear_range(${branchRangesName}[${indexName}]);\n`;
  result += "\n";
  result += `const t_old_range = t_context.activeRange;\n`;
  result += `t_set_active_range(${branchRangeName});\n`;
  result += "\n";
  status.lastNodeName = "";
  for (let child of filterChildren(node)) {
    result += buildNode(child, status, parentName, anchorName);
  }
  result += "\n";
  result += `${indexName} = ${index};\n`;
  if (status.lastNodeName) {
    // TODO: get the last node name (element or text) that has the same parent
    result += `${branchRangeName}.endNode = ${status.lastNodeName};\n`;
  }
  result += `t_context.activeRange = t_old_range;\n`;
  result += "}\n";

  unscopeNodeNames(status, startNodeNames);

  return result;
}

function buildSwitchNode(
  node: ControlNode,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
): string {
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

  let result = "";

  result += "\n";
  result += "//\n";
  result += "// === SWITCH ===\n";
  result += "//\n";
  result += `const ${switchAnchorName} = document.createComment("@switch");\n`;
  result += `${parentName}.insertBefore(${switchAnchorName}, ${anchorName});\n`;
  result += "\n";
  result += `let ${switchIndexName} = -1;\n`;
  result += `let ${switchRangeName} = { title: "@switch ${node.statement}" };\n`;
  result += `let ${switchBranchRangesName} = [${branches.map((x) => `{ title: '@branch ${x.statement}' }`).join(", ")}];\n`;
  result += "\n";
  result += `const ${oldRangeName} = t_context.activeRange;\n`;
  result += `t_set_active_range(${switchRangeName});\n`;
  result += "\n";
  result += `watchEffect(() => {\n`;
  result += `t_context.activeRange = ${switchRangeName};\n`;
  result += `${node.statement} {\n`;

  for (let [i, branch] of branches.entries()) {
    status.startNodeNames.push({
      name: `${switchBranchRangesName}[${i}].startNode`,
      status: "unset",
    });
    result += buildSwitchBranch(
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

  result += "}\n";
  result += "});\n";
  result += `t_context.activeRange = ${oldRangeName};\n\n`;

  return result;
}

function buildSwitchBranch(
  node: ControlNode,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
  branchRangesName: string,
  indexName: string,
  index: number,
): string {
  const startNodeNames = scopeNodeNames(status);

  const branchRangeName = `${branchRangesName}[${index}]`;

  let result = "";
  result += `${node.statement} {\n`;
  result += `if (${indexName} === ${index}) return;\n`;
  result += `if (${indexName} !== -1) t_clear_range(${branchRangesName}[${indexName}]);\n`;
  result += "\n";
  result += `const t_old_range = t_context.activeRange;\n`;
  result += `t_set_active_range(${branchRangeName});\n`;
  result += "\n";
  status.lastNodeName = "";
  for (let child of filterChildren(node)) {
    result += buildNode(child, status, parentName, anchorName);
  }
  result += "\n";
  result += `${indexName} = ${index};\n`;
  if (status.lastNodeName) {
    result += `${branchRangeName}.endNode = ${status.lastNodeName};\n`;
  }
  result += `t_context.activeRange = t_old_range;\n`;
  result += "break;\n";
  result += "}\n";

  unscopeNodeNames(status, startNodeNames);

  return result;
}

const forLoopRegex = /for\s*\((.+?);.*?;.*?\)/;
const forLoopVarsRegex = /(?:let\s+|var\s+){0,1}([^\s,;+=]+)(?:\s*=\s*[^,;]+){0,1}/g;
const forOfRegex = /for\s*\(\s*(?:let\s*|var\s*){0,1}(.+?)\s+(?:of|in).*?\)/;

function buildForNode(
  node: ControlNode,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
): string {
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

  let result = "";
  result += "\n";
  result += "//\n";
  result += "// === FOR ===\n";
  result += "//\n";
  result += `const ${forAnchorName} = document.createComment("@for");\n`;
  result += `${parentName}.insertBefore(${forAnchorName}, ${anchorName});\n`;
  result += "\n";
  result += `let ${forItemsName} = [];\n`;
  result += `let ${forRangeName} = { title: "@for ${node.statement}" };\n`;
  result += "\n";
  result += `const ${oldRangeName} = t_context.activeRange;\n`;
  result += `t_set_active_range(${forRangeName});\n`;
  result += "\n";
  result += `watchEffect(() => {\n`;
  result += `t_context.activeRange = ${forRangeName};\n`;
  result += `let t_for_items = [];\n`;
  result += `${node.statement} {\n`;
  // TODO: Because we're accessing item properties out here, they get attached to the @for anchor and don't get cleaned up
  // Somehow we need to attach them to the appropriate @foritem anchor instead
  result += `let t_item = {};\n`;
  if (key) {
    const keyStatement = (key as ControlNode).statement;
    result += `t_item.key = ${keyStatement.substring(keyStatement.indexOf("=") + 1).trim()};\n`;
  }
  result += `t_item.data = {};\n`;
  for (let v of forVarNames) {
    result += `t_item.data["${v}"] = ${v};\n`;
  }
  result += `t_for_items.push(t_item);\n`;
  result += `}\n`;
  result += "\n";
  result += `t_reconcile_list(\n`;
  result += `${parentName},\n`;
  result += `${forItemsName},\n`;
  result += `t_for_items,\n`;
  result += "/**\n";
  result += " * @param {Node} t_parent\n";
  result += " * @param {any} t_item\n";
  result += " * @param {Node | null} t_before\n";
  result += " */\n";
  result += `(t_parent, t_item, t_before) => {\n`;
  result += `let { ${forVarNames.join(", ")} } = t_item.data;\n`;
  status.startNodeNames.push({ name: `t_item.startNode`, status: "unset" });
  result += buildForItem(node, status, "t_parent");
  status.startNodeNames.pop();
  result += `},\n`;
  result += `);\n`;
  result += "\n";
  result += `${forItemsName} = t_for_items;\n`;
  result += "});\n";
  result += `t_context.activeRange = ${oldRangeName};\n\n`;

  return result;
}

function buildForItem(node: ControlNode, status: BuildStatus, parentName: string): string {
  let result = "";
  result += "//\n";
  result += "// === FOR ITEM ===\n";
  result += "//\n";
  //result += `t_item.anchor = document.createComment("@foritem " + t_item.key);\n`;
  //result += `${parentName}.insertBefore(t_item.anchor, t_before);\n`;
  result += `const t_old_range = t_context.activeRange;\n`;
  result += `t_set_active_range(t_item);\n`;
  result += `\n`;
  status.lastNodeName = "";
  for (let child of filterChildren(node)) {
    if (child.type === "control" && (child as ControlNode).operation === "@key") {
      continue;
    }
    result += buildNode(child, status, parentName, "t_before");
  }
  result += "\n";
  if (status.lastNodeName) {
    // TODO: get the last node name (element or text) that has the same parent
    result += `t_item.endNode = ${status.lastNodeName};\n`;
  }
  result += `t_context.activeRange = t_old_range;\n\n`;
  return result;
}

function buildAwaitNode(
  node: ControlNode,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
): string {
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

  let result = "";

  result += "\n";
  result += "//\n";
  result += "// === AWAIT ===\n";
  result += "//\n";
  result += `const ${awaitAnchorName} = document.createComment("@await");\n`;
  result += `${parentName}.insertBefore(${awaitAnchorName}, ${anchorName});\n`;
  result += "\n";
  // Use an incrementing token to make sure only the last request gets handled
  // TODO: This might have unforeseen consequences
  result += `let ${awaitTokenName} = 0;\n`;
  result += `let ${awaitIndexName} = -1;\n`;
  result += `let ${awaitRangeName} = { title: "@await ${branches[0].statement}" };\n`;
  result += `let ${awaitBranchRangesName} = [${branches.map((x) => `{ title: '@branch ${x.statement}' }`).join(", ")}];\n`;
  result += "\n";
  result += `const ${oldRangeName} = t_context.activeRange;\n`;
  result += `t_set_active_range(${awaitRangeName});\n`;
  result += "\n";
  result += `watchEffect(() => {\n`;
  result += `${awaitTokenName}++;\n`;
  result += `t_context.activeRange = ${awaitRangeName};\n`;
  result += "\n";

  status.startNodeNames.push({ name: `${awaitBranchRangesName}[0].startNode`, status: "unset" });
  result += buildAwaitBranch(
    awaitBranch,
    status,
    parentName,
    awaitAnchorName,
    awaitBranchRangesName,
    awaitIndexName,
    0,
  );
  status.startNodeNames.pop();

  result += "\n";
  result += `((token) => {\n`;
  result += `${awaiterName}\n`;
  result += `.then((${thenVar}) => {\n`;
  result += `if (token === ${awaitTokenName}) {\n`;

  status.startNodeNames.push({ name: `${awaitBranchRangesName}[1].startNode`, status: "unset" });
  result += buildAwaitBranch(
    thenBranch,
    status,
    parentName,
    awaitAnchorName,
    awaitBranchRangesName,
    awaitIndexName,
    1,
  );
  status.startNodeNames.pop();

  result += `}\n`;
  result += `})\n`;
  result += `.catch((${catchVar}) => {\n`;
  result += `if (token === ${awaitTokenName}) {\n`;

  status.startNodeNames.push({ name: `${awaitBranchRangesName}[2].startNode`, status: "unset" });
  result += buildAwaitBranch(
    catchBranch,
    status,
    parentName,
    awaitAnchorName,
    awaitBranchRangesName,
    awaitIndexName,
    2,
  );
  status.startNodeNames.pop();

  result += `}\n`;
  result += `});\n`;
  result += `})(${awaitTokenName});\n`;
  result += `});\n`;
  result += `t_context.activeRange = ${oldRangeName};\n\n`;

  return result;
}

function buildAwaitBranch(
  node: ControlNode,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
  branchRangesName: string,
  indexName: string,
  index: number,
): string {
  const startNodeNames = scopeNodeNames(status);

  const branchRangeName = `${branchRangesName}[${index}]`;

  let result = "";
  result += `if (${indexName} !== -1) t_clear_range(${branchRangesName}[${indexName}]);\n`;
  result += "\n";
  result += `const t_old_range = t_context.activeRange;\n`;
  result += `t_set_active_range(${branchRangeName});\n`;
  result += "\n";
  status.lastNodeName = "";
  for (let child of filterChildren(node)) {
    result += buildNode(child, status, parentName, anchorName);
  }
  result += "\n";
  result += `${indexName} = ${index};\n`;
  if (status.lastNodeName) {
    result += `${branchRangeName}.endNode = ${status.lastNodeName};\n`;
  }
  result += `t_context.activeRange = t_old_range;\n`;

  unscopeNodeNames(status, startNodeNames);

  return result;
}

function buildComponentNode(
  node: ElementNode,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
  root = false,
): string {
  let result = "";

  // Props
  const propsName = nextVarName("props", status);
  const componentHasProps = node.attributes.length || root;
  if (componentHasProps) {
    // TODO: defaults etc props
    result += `const ${propsName} = watch({});\n`;
    for (let { name, value } of node.attributes) {
      if (name.startsWith("{") && name.endsWith("}")) {
        name = name.substring(1, name.length - 1);
        result += `watchEffect(() => ${propsName}["${name}"] = ${name});\n`;
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
        result += generated ? `watchEffect(() => ` : "";
        result += `${propsName}["${name}"] = ${value || "true"}`;
        result += generated ? `)` : "";
        result += ";\n";
      }
    }
    // PERF: Does this have much of an impact??
    if (root) {
      result += `if ($props) {\n`;
      result += `const propNames = [${status.props.map((p) => `'${p}'`).join(", ")}];\n`;
      result += `for (let name of Object.keys($props)) {\n`;
      result += `if (!name.startsWith("$") && !propNames.includes(name)) {\n`;
      result += `watchEffect(() => ${propsName}[name] = $props[name]);\n`;
      result += `}\n`;
      result += `}\n`;
      result += `}\n`;
    }
  }

  // Slots
  const slotsName = nextVarName("slots", status);
  const componentHasSlots = node.children.length;
  if (componentHasSlots) {
    const slots = gatherSlotNodes(node);
    result += `const ${slotsName} = {};\n`;
    for (let [key, value] of Object.entries(slots)) {
      result += `${slotsName}["${key}"] = ($parent, $anchor, $sprops) => {\n`;
      for (let child of filterChildren(value)) {
        result += buildNode(child, status, "$parent", "$anchor");
      }
      result += "};\n";
    }
  }

  // Call the component's render function
  result += `${node.tagName}.render(${parentName}, ${anchorName}, ${componentHasProps ? propsName : "undefined"}, ${componentHasSlots ? slotsName : "undefined"}, $context);\n`;

  return result;
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
): string {
  const varName = nextVarName(node.tagName, status);

  let result = "";
  result += `const ${varName} = document.createElement("${node.tagName}");\n`;
  // PERF: Does this have much of an impact??
  if (root) {
    result += `if ($props) {\n`;
    result += `const propNames = [${status.props.map((p) => `'${p}'`).join(", ")}];\n`;
    result += `t_apply_attributes(${varName}, $props, propNames);\n`;
    result += `}\n`;
  }
  result += buildElementAttributes(node, varName, status);
  for (let child of filterChildren(node)) {
    result += buildNode(child, status, varName, "null");
  }
  result += `${parentName}.insertBefore(${varName}, ${anchorName});\n`;

  // TODO: Do this for text nodes too
  result += setScopedNodes(status, varName);

  return result;
}

function buildElementAttributes(node: ElementNode, varName: string, status: BuildStatus): string {
  let result = "";

  for (let attribute of node.attributes) {
    let { name, value } = attribute;
    if (name.startsWith("{") && name.endsWith("}")) {
      name = name.substring(1, name.length - 1);
      result += `watchEffect(() => `;
      result += `${varName}.setAttribute("${name}", ${name})`;
      result += `);\n`;
    } else {
      let generated = value.startsWith("{") && value.endsWith("}");
      if (generated) {
        value = value.substring(1, value.length - 1);
      }

      if (name.indexOf("on") === 0) {
        // Add an event listener
        const eventName = name.substring(2);
        result += `${varName}.addEventListener("${eventName}", ${value});\n`;
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
        result += generated ? `watchEffect(() => ` : "";
        result += `${varName}.setAttribute("${propName}", ${set})`;
        result += generated ? `)` : "";
        result += ";\n";
        // TODO: Add a parseInput method that handles NaN etc
        result += `${varName}.addEventListener("${eventName}", (e) => ${value} = ${inputValue});\n`;
      } else if (name.indexOf("class:") === 0) {
        const propName = name.substring(6);
        result += generated ? `watchEffect(() => {\n` : "";
        result += `${varName}.classList.toggle("${propName}", ${value});\n`;
        result += generated ? `});\n` : "";
      } else if (name === "class") {
        // NOTE: Clear any previously set values from the element
        const classVarName = nextVarName("class_name", status);
        result += generated ? `let ${classVarName} = ${value};\n` : "";
        result += generated ? `watchEffect(() => {\n` : "";
        result += generated
          ? `if (${classVarName}) ${varName}.classList.remove(${classVarName});\n`
          : "";
        result += generated ? `if (${value}) {\n` : "";
        result += `${varName}.classList.add(...${value}.split(" "));\n`;
        result += generated ? `${classVarName} = ${value};\n` : "";
        result += generated ? `}\n` : "";
        result += generated ? `});\n` : "";
      } else {
        // Set the attribute value
        result += generated ? `watchEffect(() => ` : "";
        result += `${varName}.setAttribute("${name}", ${value})`;
        result += generated ? `)` : "";
        result += ";\n";
      }
    }
  }

  return result;
}

function buildTextNode(
  node: TextNode,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
): string {
  let result = "";

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
  result += `const ${varName} = document.createTextNode(${generated ? '""' : content});\n`;
  result += `${parentName}.insertBefore(${varName}, ${anchorName});\n`;

  if (generated) {
    result += `watchEffect(() => ${varName}.textContent = ${content});\n`;
  }

  //result += setScopedNodes(status, varName);

  return result;
}

function buildSpecialNode(
  node: ElementNode,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
): string {
  switch (node.tagName) {
    case ":slot": {
      return buildSlotNode(node, status, parentName, anchorName);
    }
  }
  return "";
}

function buildSlotNode(
  node: ElementNode,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
): string {
  // If there's a slot, build that, otherwise build the default nodes
  let slotName = node.attributes.find((a) => a.name === "name")?.value;
  if (slotName) {
    slotName = trimAny(slotName, `'"`);
  } else {
    slotName = "_";
  }

  let result = "";

  // Slot props
  const propsName = nextVarName("sprops", status);
  const slotAttributes = node.attributes.filter((a) => a.name !== "name");
  const slotHasProps = slotAttributes.length;
  if (slotHasProps) {
    // TODO: defaults etc props
    result += `const ${propsName} = watch({});\n`;
    for (let { name, value } of slotAttributes) {
      if (name.startsWith("{") && name.endsWith("}")) {
        name = name.substring(1, name.length - 1);
        result += `watchEffect(() => `;
        result += `${propsName}["${name}"] = ${name}`;
        result += `);\n`;
      } else {
        let generated = value.startsWith("{") && value.endsWith("}");
        if (generated) {
          value = value.substring(1, value.length - 1);
        }
        result += generated ? `watchEffect(() => ` : "";
        result += `${propsName}["${name}"] = ${value}`;
        result += generated ? `)` : "";
        result += ";\n";
      }
    }
  }

  result += `if ($slots && $slots["${slotName}"]) {\n`;
  result += `$slots["${slotName}"](${parentName}, ${anchorName}, ${slotHasProps ? propsName : "undefined"});\n`;
  result += "} else {\n";
  for (let child of filterChildren(node)) {
    result += buildNode(child, status, parentName, anchorName);
  }
  result += "}\n";
  return result;
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
  let result = "";

  for (let startNodeName of status.startNodeNames) {
    if (startNodeName.status === "unset") {
      result += `if (!${startNodeName.name}) {\n`;
      result += `${startNodeName.name} = ${varName};\n`;
      result += `}\n`;
      startNodeName.status = "set";
    } else if (startNodeName.status === "scoped") {
      result += `${startNodeName.name} = ${varName};\n`;
      //result += `console.log("setting", "${startNodeName.name}", JSON.stringify(${startNodeName.name}, null, 2), "${varName}", ${varName});\n`;
      startNodeName.status = "scopedset";
    }
  }

  status.lastNodeName = varName;

  return result;
}

function buildStyles(name: string, parts: ComponentParts): string {
  let result = "";

  for (let block of parts.style!.blocks) {
    result += buildStyleBlock(block, parts.styleHash!);
  }

  return result;
}

const globalStyleRegex = /\:global\((.+)\)/;

function buildStyleBlock(block: StyleBlock, styleHash: string): string {
  let result = "";

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

  result += `${selectors.join(" ")} {\n`;
  for (let attribute of block.attributes) {
    result += buildStyleAttribute(attribute);
  }
  for (let child of block.children) {
    result += buildStyleBlock(child, styleHash);
  }
  result += "}\n";

  return result;
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
