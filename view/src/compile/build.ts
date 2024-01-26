import ElementNode from "../nodes/ElementNode";
import LogicNode from "../nodes/LogicNode";
import Node from "../nodes/Node";
import TextNode from "../nodes/TextNode";
import SyntaxTree from "../types/SyntaxTree";

export default function build(name: string, syntaxTree: SyntaxTree): string {
  let result = "";

  result += "import watchEffect from '../../watch/src/watchEffect';\n";
  result += "import clearRange from '../../view/src/render/clearRange';\n";
  result += "import reconcileList from '../../view/src/render/reconcileList';\n";
  if (syntaxTree.imports) {
    result += syntaxTree.imports.join("\n") + "\n\n";
  }

  result += `const ${name} = {\n`;
  result += `name: "${name}",\n`;
  result += `render: (parent: Node, anchor: Node | null) => {\n`;

  if (syntaxTree.script) {
    // TODO: Mangling
    result += syntaxTree.script + "\n\n";
  }

  if (syntaxTree.template) {
    // We could create a document fragment with a string and assign the created elements to variables
    // It would mean we could use the same code for hydration too

    // TODO: If it's a component or logic block, build the anchor etc

    let varNames: Record<string, number> = {};
    result += buildNode(syntaxTree.template, varNames, "parent", "anchor && anchor.nextSibling");
  }

  result += `\n}\n};\n\nexport default ${name};`;

  if (syntaxTree.style) {
    // TODO: Mangling
    //result += syntaxTree.style;
  }

  return result;
}

function buildNode(
  node: Node,
  varNames: Record<string, number>,
  parentName: string,
  anchorName: string,
): string {
  switch (node.type) {
    case "element": {
      return buildElementNode(node as ElementNode, varNames, parentName, anchorName);
    }
    case "logic": {
      return buildLogicNode(node as LogicNode, varNames, parentName, anchorName);
    }
    case "text": {
      return buildTextNode(node as TextNode, varNames, parentName, anchorName);
    }
    default: {
      throw new Error(`Invalid node type: ${node.type}`);
    }
  }
}

function buildTextNode(
  node: TextNode,
  varNames: Record<string, number>,
  parentName: string,
  anchorName: string,
): string {
  let result = "";

  let content = node.content || "";
  // Replace all spaces with a single space, both to save space and to remove newlines from generated JS strings
  content = content.replace(/\s+/g, " ");
  // TODO: Should be fancier about this in parse -- e.g. ignore braces in quotes, unclosed, etc
  // TODO: We also shouldn't be string interpolating if there is only code
  let generated = content.includes("{") && content.includes("}");
  if (generated) {
    content = `\`${content.replaceAll("{", "${")}\``;
  } else {
    content = `"${content.replaceAll('"', '\\"')}"`;
  }

  const varName = nextVarName("text", varNames);
  result += `const ${varName} = document.createTextNode(${generated ? '""' : content});\n`;
  result += `${parentName}.insertBefore(${varName}, ${anchorName});\n`;

  if (generated) {
    result += `watchEffect(() => ${varName}.textContent = ${content});\n`;
  }

  return result;
}

function buildLogicNode(
  node: LogicNode,
  varNames: Record<string, number>,
  parentName: string,
  anchorName: string,
): string {
  switch (node.operation) {
    case "@const": {
      return node.logic + (!node.logic.endsWith(";") ? ";" : "");
    }
    case "@if group": {
      return buildIfNode(node, varNames, parentName, anchorName);
    }
    case "@if":
    case "@else if":
    case "@else": {
      // These get handled with @if group, above
      return "";
    }
    case "@switch": {
      return buildSwitchNode(node, varNames, parentName, anchorName);
    }
    case "@case": {
      // This gets handled with @switch, above
      return "";
    }
    case "@for": {
      return buildForNode(node, varNames, parentName, anchorName);
    }
    case "@await group": {
      return buildAwaitNode(node, varNames, parentName, anchorName);
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
  varNames: Record<string, number>,
  parentName: string,
  anchorName: string,
): string {
  const startAnchorName = nextVarName("logicAnchor", varNames);
  const endNodeName = nextVarName("logicEndNode", varNames);
  const indexName = nextVarName("logicIndex", varNames);

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
  result += `let ${endNodeName}: ChildNode | undefined;\n`;
  result += `let ${indexName} = -1;\n`;
  result += `watchEffect(() => {\n`;
  for (let [i, branch] of branches.entries()) {
    result += buildIfBranch(
      branch as LogicNode,
      varNames,
      parentName,
      startAnchorName,
      endNodeName,
      indexName,
      i,
    );
  }
  result += "});\n\n";
  return result;
}

function buildIfBranch(
  node: LogicNode,
  varNames: Record<string, number>,
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
  let endElementName = "undefined";
  for (let child of filterChildren(node)) {
    // HACK: Is there a better way to do this
    let childName = nextNodeName(child, varNames, false);
    if (child.type === "element") {
      endElementName = childName;
    }
    result += buildNode(child, varNames, parentName, `${anchorName}.nextSibling`);
    anchorName = childName;
  }
  result += "\n";
  result += `${endNodeName} = ${endElementName};\n`;
  result += `${indexName} = ${index};\n`;
  result += "}\n";
  return result;
}

function buildSwitchNode(
  node: LogicNode,
  varNames: Record<string, number>,
  parentName: string,
  anchorName: string,
): string {
  const startAnchorName = nextVarName("logicAnchor", varNames);
  const endNodeName = nextVarName("logicEndNode", varNames);
  const indexName = nextVarName("logicIndex", varNames);

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
  result += `let ${endNodeName}: ChildNode | undefined;\n`;
  result += `let ${indexName} = -1;\n`;
  result += `watchEffect(() => {\n`;
  result += `${node.logic} {\n`;
  for (let [i, branch] of branches.entries()) {
    result += buildSwitchBranch(
      branch as LogicNode,
      varNames,
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
  varNames: Record<string, number>,
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
  let endElementName = "undefined";
  for (let child of filterChildren(node)) {
    // HACK: Is there a better way to do this
    let childName = nextNodeName(child, varNames, false);
    if (child.type === "element") {
      endElementName = childName;
    }
    result += buildNode(child, varNames, parentName, `${anchorName}.nextSibling`);
    anchorName = childName;
  }
  result += "\n";
  result += `${endNodeName} = ${endElementName};\n`;
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
  varNames: Record<string, number>,
  parentName: string,
  anchorName: string,
): string {
  // HACK: Need to wrangle the declaration(s) out of the for loop and put them in data
  // TODO: Handle destructuring, quotes, comments etc
  const forVarNames: string[] = [];
  const cforMatches = node.logic.match(forLoopRegex);
  if (cforMatches) {
    const forVarMatches = cforMatches[1].matchAll(forLoopVarsRegex);
    for (let match of forVarMatches) {
      forVarNames.push(match[1]);
    }
  } else {
    const forOfMatch = node.logic.match(forOfRegex);
    if (forOfMatch) {
      forVarNames.push(forOfMatch[1]);
    }
  }

  const startAnchorName = nextVarName("logicAnchor", varNames);
  const forItemsName = nextVarName("forItems", varNames);

  // Filter non-logic branches (spaces)
  const key = node.children.find(
    (n) => n.type === "logic" && (n as LogicNode).operation === "@key",
  );

  let result = "";
  result += "\n";
  result += `const ${startAnchorName} = document.createComment("@for");\n`;
  result += `${parentName}.insertBefore(${startAnchorName}, ${anchorName});\n`;
  result += "\n";
  result += `let ${forItemsName}: any[] = [];\n`;
  result += `watchEffect(() => {\n`;
  result += `let newForItems: any[] = [];\n`;
  result += `${node.logic} {\n`;
  result += `let item: any = {};\n`;
  if (key) {
    const keyLogic = (key as LogicNode).logic;
    result += `item["key"] = ${keyLogic.substring(keyLogic.indexOf("=") + 1).trim()};\n`;
  }
  result += `item.data = {};\n`;
  for (let v of forVarNames) {
    result += `item.data["${v}"] = ${v};\n`;
  }
  result += `newForItems.push(item);\n`;
  result += `}\n`;
  result += "\n";
  result += `reconcileList(\n`;
  result += `${parentName},\n`;
  result += `${forItemsName},\n`;
  result += `newForItems,\n`;
  result += `(parent: Node, item: any, before: Node | null) => {\n`;
  result += `let { ${forVarNames.join(", ")} } = item.data;\n`;
  result += buildForItem(node, varNames, "parent");
  result += `},\n`;
  result += `);\n`;
  result += "\n";
  result += `${forItemsName} = newForItems;\n`;
  result += "});\n\n";
  return result;
}

function buildForItem(
  node: LogicNode,
  varNames: Record<string, number>,
  parentName: string,
): string {
  let result = "";
  result += `item.anchor = document.createComment("@for item " + item.key);\n`;
  result += `${parentName}.insertBefore(item.anchor, before);\n`;
  result += `\n`;
  result += "\n";
  let endElementName = "undefined";
  for (let child of filterChildren(node)) {
    if (child.type === "logic" && (child as LogicNode).operation === "@key") {
      continue;
    }

    // HACK: Is there a better way to do this
    let childName = nextNodeName(child, varNames, false);
    if (child.type === "element") {
      endElementName = childName;
    }
    result += buildNode(child, varNames, parentName, "before");
  }
  result += "\n";
  result += `item.endNode = ${endElementName};\n`;
  return result;

  /*
  let result = "";
  result += `if (${endNodeName}) clearRange(${anchorName}, ${endNodeName});\n`;
  result += "let abcd = 0;\n";
  result += `${node.logic} {\n`;
  result += "console.log(abcd++);\n";
  result += "\n";
  let endElementName = "undefined";
  for (let child of filterChildren(node)) {
    // HACK: Is there a better way to do this
    let childName = nextNodeName(child, varNames, false);
    if (child.type === "element") {
      endElementName = childName;
    }
    result += buildNode(child, varNames, parentName, `${cursorName}.nextSibling`);
    //anchorName = childName;
  }
  result += "\n";
  result += `${endNodeName} = ${endElementName};\n`;
  result += `${cursorName} = ${endElementName};\n`;
  result += "}\n";
  return result;
  */
}

function buildAwaitNode(
  node: LogicNode,
  varNames: Record<string, number>,
  parentName: string,
  anchorName: string,
): string {
  const startAnchorName = nextVarName("logicAnchor", varNames);
  const endNodeName = nextVarName("logicEndNode", varNames);
  const awaitTokenName = nextVarName("awaitToken", varNames);

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
  result += `let ${endNodeName}: ChildNode | undefined;\n`;
  // Use an incrementing token to make sure only the last request gets handled
  // TODO: This might have unforeseen consequences
  result += `let ${awaitTokenName} = 0;\n`;
  result += `watchEffect(() => {\n`;
  result += `${awaitTokenName}++;\n`;
  result += "\n";
  result += buildAwaitBranch(awaitBranch, varNames, parentName, startAnchorName, endNodeName);
  result += "\n";
  result += `((token: number) => {\n`;
  result += `${awaiterName}\n`;
  result += `.then((${thenVar}) => {\n`;
  result += `if (token === ${awaitTokenName}) {\n`;
  result += buildAwaitBranch(thenBranch, varNames, parentName, startAnchorName, endNodeName);
  result += `}\n`;
  result += `})\n`;
  result += `.catch((${catchVar}) => {\n`;
  result += `if (token === ${awaitTokenName}) {\n`;
  result += buildAwaitBranch(catchBranch, varNames, parentName, startAnchorName, endNodeName);
  result += `}\n`;
  result += `});\n`;
  result += `})(${awaitTokenName});\n`;
  result += `});\n\n`;

  return result;
}

function buildAwaitBranch(
  node: LogicNode,
  varNames: Record<string, number>,
  parentName: string,
  anchorName: string,
  endNodeName: string,
): string {
  let result = "";
  result += `if (${endNodeName}) clearRange(${anchorName}, ${endNodeName});\n`;
  result += "\n";
  let endElementName = "undefined";
  for (let child of filterChildren(node)) {
    // HACK: Is there a better way to do this
    let childName = nextNodeName(child, varNames, false);
    if (child.type === "element") {
      endElementName = childName;
    }
    result += buildNode(child, varNames, parentName, `${anchorName}.nextSibling`);
    anchorName = childName;
  }
  result += "\n";
  result += `${endNodeName} = ${endElementName};\n`;
  return result;
}

function buildElementNode(
  node: ElementNode,
  varNames: Record<string, number>,
  parentName: string,
  anchorName: string,
): string {
  const varName = nextVarName(node.tagName, varNames);
  let result = "";
  result += `const ${varName} = document.createElement("${node.tagName}");\n`;
  result += buildElementAttributes(node, varName);
  for (let child of filterChildren(node)) {
    result += buildNode(child, varNames, varName, "null");
  }
  result += `${parentName}.insertBefore(${varName}, ${anchorName});\n`;
  return result;
}

function buildElementAttributes(node: ElementNode, varName: string): string {
  let result = "";

  for (let attribute of node.attributes) {
    const { name, value } = attribute;
    if (name.indexOf("on") === 0) {
      // Add an event listener
      let listener = value;
      listener = trim(listener, "{", "}");
      result += `${varName}.addEventListener("${name.substring(2)}", ${listener});\n`;
    } else if (name === "classList" && Array.isArray(value)) {
      // Add a class for each item in the array
      // TODO: Call a function that does the stuff
      for (let i = 0; i < value.length; i++) {
        //result += addClass(node, def, attribute[i]);
      }
    } else {
      // Set the attribute value
      // TODO: Call a function that does the stuff
      result += `${varName}.setAttribute(${name}, ${value});\n`;
    }
  }

  return result;
}

function* filterChildren(node: ElementNode | LogicNode) {
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

function nextVarName(name: string, varNames: Record<string, number>, increment = true): string {
  if (!varNames[name]) {
    varNames[name] = 1;
  }
  let varName = `${name}${varNames[name]}`;
  if (increment) {
    varNames[name] += 1;
  }
  return varName;
}

function nextNodeName(node: Node, varNames: Record<string, number>, increment = true) {
  if (node.type === "element") {
    return nextVarName((node as ElementNode).tagName, varNames, false);
  } else {
    return nextVarName("text", varNames, false);
  }
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
