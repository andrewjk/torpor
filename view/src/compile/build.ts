import ElementNode from "../nodes/ElementNode";
import LogicNode from "../nodes/LogicNode";
import Node from "../nodes/Node";
import TextNode from "../nodes/TextNode";
import Attribute from "../types/Attribute";
import BuildResult from "../types/BuildResult";
import ComponentParts from "../types/ComponentParts";
import StyleBlock from "../types/StyleBlock";
import { trimAny } from "./utils";

interface BuildStatus {
  varNames: Record<string, number>;
  lastNodeName: string;
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

  result += "import watch from '../../../../watch/src/watch';\n";
  result += "import watchEffect from '../../../../watch/src/watchEffect';\n";
  result += "import clearRange from '../../../../view/src/render/clearRange';\n";
  result += "import reconcileList from '../../../../view/src/render/reconcileList';\n";
  //result += "import { watch, watchEffect } from '../../../../../tera/watch/dist/index.js';\n";
  //result += "import { clearRange, reconcileList } from '../../../../../tera/view/dist/index.js';\n";
  if (parts.imports) {
    result += parts.imports.map((i) => `import ${i.name} from '${i.path}';`).join("\n") + "\n";
  }
  result += "\n";

  // HACK: Move into utils
  result += "function defText(text) { return text != null ? text : '' }";

  result += `const ${name} = {\n`;
  result += `name: "${name}",\n`;
  result += `/**\n`;
  result += ` * @param {Node} $parent\n`;
  result += ` * @param {Node | null} $anchor\n`;
  result += ` * @param {any} $props\n`;
  result += ` * @param {any} $slots\n`;
  result += ` */\n`;
  result += `render: ($parent, $anchor, $props, $slots, $context) => {\n`;

  // Redefine context so that any newly added properties will only be passed to children
  result += `$context = Object.assign({}, $context);\n`;

  if (parts.script) {
    // TODO: Mangling
    result += parts.script + "\n\n";
  }

  if (parts.template) {
    // We could create a document fragment with a string and assign the created elements to variables
    // It would mean we could use the same code for hydration too

    const status: BuildStatus = {
      varNames: {},
      lastNodeName: "",
    };
    result += buildNode(parts.template, status, "$parent", "$anchor && $anchor.nextSibling");
  }

  result += `}\n};\n\nexport default ${name};`;

  return result;
}

function buildNode(
  node: Node,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
): string {
  switch (node.type) {
    case "component": {
      return buildComponentNode(node as ElementNode, status, parentName, anchorName);
    }
    case "element": {
      return buildElementNode(node as ElementNode, status, parentName, anchorName);
    }
    case "special": {
      return buildSpecialNode(node as ElementNode, status, parentName, anchorName);
    }
    case "logic": {
      return buildLogicNode(node as LogicNode, status, parentName, anchorName);
    }
    case "text": {
      return buildTextNode(node as TextNode, status, parentName, anchorName);
    }
    default: {
      throw new Error(`Invalid node type: ${node.type}`);
    }
  }
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
      content = `\`${content.replaceAll("{", "${defText(").replaceAll("}", ")}")}\``;
    }
  } else {
    content = `defText("${content.replaceAll('"', '\\"')}")`;
  }

  const varName = nextVarName("text", status);
  result += `const ${varName} = document.createTextNode(${generated ? '""' : content});\n`;
  result += `${parentName}.insertBefore(${varName}, ${anchorName});\n`;

  if (generated) {
    result += `watchEffect(() => ${varName}.textContent = ${content});\n`;
  }

  return result;
}

function buildLogicNode(
  node: LogicNode,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
): string {
  switch (node.operation) {
    case "@const": {
      return node.logic + (!node.logic.endsWith(";") ? ";" : "");
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
  node: LogicNode,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
): string {
  const startAnchorName = nextVarName("anchor", status);
  const endNodeName = nextVarName("end", status);
  const indexName = nextVarName("index", status);

  // Filter non-logic branches (spaces)
  const branches = node.children.filter((n) => n.type === "logic");

  // Add an else branch if there isn't one, so that the content will be cleared if no branches match
  if (branches.findIndex((n) => (n as LogicNode).operation === "@else") === -1) {
    const elseBranch: LogicNode = {
      type: "logic",
      operation: "@else",
      logic: "else",
      children: [],
    };
    branches.push(elseBranch);
  }

  let result = "";
  result += "\n";
  result += `const ${startAnchorName} = document.createComment("@if");\n`;
  result += `${parentName}.insertBefore(${startAnchorName}, ${anchorName});\n`;
  result += "\n";
  result += "/** @type {ChildNode | undefined} */\n";
  result += `let ${endNodeName};\n`;
  result += `let ${indexName} = -1;\n`;
  result += `watchEffect(() => {\n`;
  for (let [i, branch] of branches.entries()) {
    result += buildIfBranch(
      branch as LogicNode,
      status,
      parentName,
      startAnchorName,
      endNodeName,
      indexName,
      i,
    );
  }
  result += "});\n\n";

  status.lastNodeName = startAnchorName;

  return result;
}

function buildIfBranch(
  node: LogicNode,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
  endNodeName: string,
  indexName: string,
  index: number,
): string {
  let result = "";
  result += `${node.logic} {\n`;
  result += `if (${indexName} === ${index}) return;\n`;
  result += `if (${endNodeName}) clearRange(${anchorName}, ${endNodeName});\n`;
  result += "\n";
  status.lastNodeName = "undefined";
  for (let child of filterChildren(node)) {
    result += buildNode(child, status, parentName, `${anchorName}.nextSibling`);
    anchorName = status.lastNodeName;
  }
  result += "\n";
  result += `${endNodeName} = ${status.lastNodeName};\n`;
  result += `${indexName} = ${index};\n`;
  result += "}\n";
  return result;
}

function buildSwitchNode(
  node: LogicNode,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
): string {
  const startAnchorName = nextVarName("anchor", status);
  const endNodeName = nextVarName("end", status);
  const indexName = nextVarName("index", status);

  // Filter non-logic branches (spaces)
  const branches = node.children.filter((n) => n.type === "logic");

  // Add a default branch if there isn't one, so that the content will be cleared if no branches match
  if (branches.findIndex((n) => (n as LogicNode).operation === "@default") === -1) {
    const defaultBranch: LogicNode = {
      type: "logic",
      operation: "@default",
      logic: "default",
      children: [],
    };
    branches.push(defaultBranch);
  }

  let result = "";
  result += "\n";
  result += `const ${startAnchorName} = document.createComment("@switch");\n`;
  result += `${parentName}.insertBefore(${startAnchorName}, ${anchorName});\n`;
  result += "\n";
  result += "/** @type {ChildNode | undefined} */\n";
  result += `let ${endNodeName};\n`;
  result += `let ${indexName} = -1;\n`;
  result += `watchEffect(() => {\n`;
  result += `${node.logic} {\n`;
  for (let [i, branch] of branches.entries()) {
    result += buildSwitchBranch(
      branch as LogicNode,
      status,
      parentName,
      startAnchorName,
      endNodeName,
      indexName,
      i,
    );
  }
  result += "}\n";
  result += "});\n\n";
  return result;
}

function buildSwitchBranch(
  node: LogicNode,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
  endNodeName: string,
  indexName: string,
  index: number,
): string {
  let result = "";
  result += `${node.logic} {\n`;
  result += `if (${indexName} === ${index}) return;\n`;
  result += `if (${endNodeName}) clearRange(${anchorName}, ${endNodeName});\n`;
  result += "\n";
  status.lastNodeName = "undefined";
  for (let child of filterChildren(node)) {
    result += buildNode(child, status, parentName, `${anchorName}.nextSibling`);
    anchorName = status.lastNodeName;
  }
  result += "\n";
  result += `${endNodeName} = ${status.lastNodeName};\n`;
  result += `${indexName} = ${index};\n`;
  result += "break;\n";
  result += "}\n";
  return result;
}

const forLoopRegex = /for\s*\((.+?);.*?;.*?\)/;
const forLoopVarsRegex = /(?:let\s+|var\s+){0,1}([^\s,;+=]+)(?:\s*=\s*[^,;]+){0,1}/g;
const forOfRegex = /for\s*\(\s*(?:let\s*|var\s*){0,1}(.+?)\s+(?:of|in).*?\)/;

function buildForNode(
  node: LogicNode,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
): string {
  // HACK: Need to wrangle the declaration(s) out of the for loop and put them in data
  // TODO: Handle destructuring, quotes, comments etc
  const forVarNames: string[] = [];
  const forIndexMatch = node.logic.match(forLoopRegex);
  if (forIndexMatch) {
    const forVarMatches = forIndexMatch[1].matchAll(forLoopVarsRegex);
    for (let match of forVarMatches) {
      forVarNames.push(match[1]);
    }
  } else {
    const forOfMatch = node.logic.match(forOfRegex);
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

  const startAnchorName = nextVarName("anchor", status);
  const forItemsName = nextVarName("for_items", status);

  // Filter non-logic branches (spaces)
  const key = node.children.find(
    (n) => n.type === "logic" && (n as LogicNode).operation === "@key",
  );

  let result = "";
  result += "\n";
  result += `const ${startAnchorName} = document.createComment("@for");\n`;
  result += `${parentName}.insertBefore(${startAnchorName}, ${anchorName});\n`;
  result += "\n";
  result += "/** @type {any[]} */\n";
  result += `let ${forItemsName} = [];\n`;
  result += `watchEffect(() => {\n`;
  result += "/** @type {any[]} */\n";
  result += `let t_for_items = [];\n`;
  result += `${node.logic} {\n`;
  result += "/** @type {any} */\n";
  // TODO: Handle name collisions
  result += `let t_item = {};\n`;
  if (key) {
    const keyLogic = (key as LogicNode).logic;
    result += `t_item["t_key"] = ${keyLogic.substring(keyLogic.indexOf("=") + 1).trim()};\n`;
  }
  result += `t_item.data = {};\n`;
  for (let v of forVarNames) {
    result += `t_item.data["${v}"] = ${v};\n`;
  }
  result += `t_for_items.push(t_item);\n`;
  result += `}\n`;
  result += "\n";
  result += `reconcileList(\n`;
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
  result += buildForItem(node, status, "t_parent");
  result += `},\n`;
  result += `);\n`;
  result += "\n";
  result += `${forItemsName} = t_for_items;\n`;
  result += "});\n\n";
  return result;
}

function buildForItem(node: LogicNode, status: BuildStatus, parentName: string): string {
  let result = "";
  result += `t_item.anchor = document.createComment("@for item " + t_item.t_key);\n`;
  result += `${parentName}.insertBefore(t_item.anchor, t_before);\n`;
  result += `\n`;
  result += "\n";
  status.lastNodeName = "undefined";
  for (let child of filterChildren(node)) {
    if (child.type === "logic" && (child as LogicNode).operation === "@key") {
      continue;
    }
    result += buildNode(child, status, parentName, "t_before");
  }
  result += "\n";
  result += `t_item.endNode = ${status.lastNodeName};\n`;
  return result;
}

function buildAwaitNode(
  node: LogicNode,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
): string {
  const startAnchorName = nextVarName("anchor", status);
  const endNodeName = nextVarName("end", status);
  const awaitTokenName = nextVarName("token", status);

  // Filter non-logic branches (spaces)
  const branches = node.children.filter((n) => n.type === "logic");

  // Make sure all branches exist
  let awaitBranch = branches.find((n) => (n as LogicNode).operation === "@await") as LogicNode;
  let thenBranch = branches.find((n) => (n as LogicNode).operation === "@then") as LogicNode;
  if (!thenBranch) {
    thenBranch = {
      type: "logic",
      operation: "@then",
      logic: "then",
      children: [],
    };
  }
  let catchBranch = branches.find((n) => (n as LogicNode).operation === "@catch") as LogicNode;
  if (!catchBranch) {
    catchBranch = {
      type: "logic",
      operation: "@catch",
      logic: "catch",
      children: [],
    };
  }

  const awaiterName = trim(awaitBranch.logic.substring("await".length), "(", ")");
  const thenVar = trim(thenBranch.logic.substring("then".length), "(", ")");
  const catchVar = trim(catchBranch.logic.substring("catch".length), "(", ")");

  let result = "";
  result += "\n";
  result += `const ${startAnchorName} = document.createComment("@await");\n`;
  result += `${parentName}.insertBefore(${startAnchorName}, ${anchorName});\n`;
  result += "\n";
  result += "/** @type {ChildNode | undefined} */\n";
  result += `let ${endNodeName};\n`;
  // Use an incrementing token to make sure only the last request gets handled
  // TODO: This might have unforeseen consequences
  result += `let ${awaitTokenName} = 0;\n`;
  result += `watchEffect(() => {\n`;
  result += `${awaitTokenName}++;\n`;
  result += "\n";
  result += buildAwaitBranch(awaitBranch, status, parentName, startAnchorName, endNodeName);
  result += "\n";
  result += "/** @param {number} token */\n";
  result += `((token) => {\n`;
  result += `${awaiterName}\n`;
  result += `.then((${thenVar}) => {\n`;
  result += `if (token === ${awaitTokenName}) {\n`;
  result += buildAwaitBranch(thenBranch, status, parentName, startAnchorName, endNodeName);
  result += `}\n`;
  result += `})\n`;
  result += `.catch((${catchVar}) => {\n`;
  result += `if (token === ${awaitTokenName}) {\n`;
  result += buildAwaitBranch(catchBranch, status, parentName, startAnchorName, endNodeName);
  result += `}\n`;
  result += `});\n`;
  result += `})(${awaitTokenName});\n`;
  result += `});\n\n`;

  return result;
}

function buildAwaitBranch(
  node: LogicNode,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
  endNodeName: string,
): string {
  let result = "";
  result += `if (${endNodeName}) clearRange(${anchorName}, ${endNodeName});\n`;
  result += "\n";
  status.lastNodeName = "undefined";
  for (let child of filterChildren(node)) {
    result += buildNode(child, status, parentName, `${anchorName}.nextSibling`);
    anchorName = status.lastNodeName;
  }
  result += "\n";
  result += `${endNodeName} = ${status.lastNodeName};\n`;
  return result;
}

function buildComponentNode(
  node: ElementNode,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
): string {
  let result = "";

  // Props
  const propsName = nextVarName("props", status);
  const componentHasProps = node.attributes.length;
  if (componentHasProps) {
    // TODO: defaults etc props
    result += `const ${propsName} = watch({});\n`;
    for (let { name, value } of node.attributes) {
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
        result += `${propsName}["${name}"] = ${value || "true"}`;
        result += generated ? `)` : "";
        result += ";\n";
      }
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

/*
function buildSlot(
  slotsName: string,
  name: string,
  children: Node[],
  node: LogicNode,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
  endNodeName: string,
  indexName: string,
  index: number,
) {
  let result = "";
  result += `${slotsName}["${name}"] = () => {\n`;
  for (let child of filterChildren(children)) {
    result += buildNode(child, status, parentName, `${anchorName}.nextSibling`);
  }
  result += "};";
  return result;
}
*/

function buildElementNode(
  node: ElementNode,
  status: BuildStatus,
  parentName: string,
  anchorName: string,
): string {
  const varName = nextVarName(node.tagName, status);

  let result = "";
  result += `const ${varName} = document.createElement("${node.tagName}");\n`;
  result += buildElementAttributes(node, varName, status);
  for (let child of filterChildren(node)) {
    result += buildNode(child, status, varName, "null");
  }
  result += `${parentName}.insertBefore(${varName}, ${anchorName});\n`;

  status.lastNodeName = varName;

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
        const eventName = "input";
        const defaultValue = '""';
        const propName = name.substring(5);
        result += generated ? `watchEffect(() => ` : "";
        result += `${varName}.setAttribute("${propName}", ${value} || ${defaultValue})`;
        result += generated ? `)` : "";
        result += ";\n";
        result += `${varName}.addEventListener("${eventName}", (e) => ${value} = e.target.value);\n`;
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
        result += `${varName}.classList.add(${value});\n`;
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

  result += `if ($slots["${slotName}"]) {\n`;
  result += `$slots["${slotName}"](${parentName}, ${anchorName}, ${slotHasProps ? propsName : "undefined"});\n`;
  result += "} else {\n";
  for (let child of filterChildren(node)) {
    result += buildNode(child, status, parentName, anchorName);
  }
  result += "}\n";
  return result;
}

function* filterChildren(node: ElementNode | LogicNode | Node[]) {
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
function processChildren(node: ElementNode | LogicNode, cb: (node: Node) => void) {
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
