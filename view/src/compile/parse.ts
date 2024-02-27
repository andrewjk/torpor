import CompileError from "../types/CompileError";
import ComponentParts from "../types/ComponentParts";
import Import from "../types/Import";
import ParseResult from "../types/ParseResult";
import Documentation from "../types/docs/Documentation";
import PropDocumentation from "../types/docs/PropDocumentation";
import SlotDocumentation from "../types/docs/SlotDocumentation";
import Attribute from "../types/nodes/Attribute";
import ControlNode from "../types/nodes/ControlNode";
import ElementNode from "../types/nodes/ElementNode";
import Node from "../types/nodes/Node";
import TextNode from "../types/nodes/TextNode";
import Style from "../types/styles/Style";
import StyleBlock from "../types/styles/StyleBlock";
import hash from "./internal/hash";
import { isAlphaNumericChar, isSpace, isSpaceChar, trimQuotes } from "./internal/utils";

interface ParseStatus {
  source: string;
  // The current index
  i: number;
  docs?: Documentation;
  script?: string;
  template?: ElementNode;
  childTemplates?: ComponentParts[];
  style?: Style;
  styleHash?: string;
  imports?: Import[];
  // Errors that have been encountered
  errors: CompileError[];
}

// From https://developer.mozilla.org/en-US/docs/Glossary/Void_element
const voidTags = [
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
];

const controlOperations = [
  "@const",
  "@if",
  "@else",
  "@for",
  "@key",
  "@switch",
  "@case",
  "@default",
  "@await",
  "@then",
  "@catch",
];

export default function parse(source: string): ParseResult {
  const status: ParseStatus = {
    source,
    i: 0,
    errors: [],
  };

  parseSource(status, source);

  checkAndApplyStyles(status);

  // HACK: get all usages of $props.name and $props["name"]
  const propsMatches = source.matchAll(/\$props\s*(?:\.([\d\w]+)|\["(.+)"\]|\['(.+)'\])/g);
  const props: string[] = [];
  for (let match of propsMatches) {
    const name = match[1] || match[2] || match[3];
    if (!props.includes(name)) {
      props.push(name);
    }
  }

  // HACK: get all usages of $context.name and $context["name"]
  const contextsMatches = source.matchAll(/\$context\s*(?:\.([\d\w]+)|\["(.+)"\]|\['(.+)'\])/g);
  const contexts: string[] = [];
  for (let match of contextsMatches) {
    const name = match[1] || match[2] || match[3];
    if (!contexts.includes(name)) {
      contexts.push(name);
    }
  }

  const ok = !status.errors.length;
  return {
    ok,
    errors: status.errors,
    parts: ok
      ? {
          docs: status.docs,
          imports: status.imports,
          script: status.script,
          template: status.template,
          childComponents: status.childTemplates,
          style: status.style,
          styleHash: status.styleHash,
          props: props.length ? props : undefined,
          contexts: contexts.length ? contexts : undefined,
        }
      : undefined,
  };
}

function parseSource(status: ParseStatus, source: string) {
  // HACK: The laziest way to handle elses etc:
  status.source = status.source
    .replace(/}(\s*)else/g, "}$1@else")
    .replace(/(\{|\})(\s*)case/g, "$1$2@case")
    .replace(/(\{|\})(\s*)default/g, "$1$2@default")
    .replace(/{(\s*)key/g, "{$1@key")
    .replace(/}(\s*)then/g, "}$1@then")
    .replace(/}(\s*)catch/g, "}$1@catch");

  for (status.i; status.i < source.length; status.i++) {
    const char = status.source[status.i];
    if (char === "<") {
      if (
        status.source[status.i + 1] === "!" &&
        status.source[status.i + 2] === "-" &&
        status.source[status.i + 3] === "-"
      ) {
        // It's a comment, swallow it
        status.i = status.source.indexOf("-->", status.i) + 3;
      } else {
        parseTopElement(status);
      }
      // HACK: Go back 1 char so it can be incremented by the loop
      // TODO: Really need to fix loops
      status.i -= 1;
    } else if (accept("/**", status)) {
      status.i -= 1;
      status.docs = parseDocs(status);
    }
  }
}

function parseTopElement(status: ParseStatus) {
  const start = status.i;
  const element = parseTagOpen(status);
  switch (element.tagName) {
    case "script": {
      if (!element.selfClosed) {
        status.script = extractElementText("script", status);
        extractScriptImports(status);
      }
      break;
    }
    case "style": {
      if (!element.selfClosed) {
        status.style = parseStyleElement(status);
      }
      break;
    }
    case "template": {
      if (!element.selfClosed) {
        const source = extractElementText("template", status);
        const childName = trimQuotes(
          element.attributes.find((a) => a.name === "name")?.value || "ChildComponent",
        );
        parseChildTemplate(childName, source, status);
      }
      break;
    }
    default: {
      if (status.template === undefined) {
        // Rewind to the start of the element
        status.i = start;
        status.template = parseElement(status);
      } else {
        addError(status, `Multiple top-level elements: ${element.tagName}`, start);
      }
      break;
    }
  }
}

function parseElement(status: ParseStatus): ElementNode {
  const element = parseTagOpen(status);

  // TODO: this check could also go in build?
  if (
    status.imports?.find((i) => i.component && i.name === element.tagName) ||
    status.childTemplates?.find((c) => c.name === element.tagName)
  ) {
    element.type = "component";
  }

  if (!element.selfClosed && !voidTags.includes(element.tagName)) {
    // Get the children
    for (status.i; status.i < status.source.length; status.i++) {
      addSpaceElement(element, status);
      const char = status.source[status.i];
      if (char === "<") {
        if (status.source[status.i + 1] === "/") {
          // It's a closing element, so we're done here
          // TODO: Check that it's the correct closing element
          status.i = status.source.indexOf(">", status.i + 1);
          break;
        } else if (
          status.source[status.i + 1] === "!" &&
          status.source[status.i + 2] === "-" &&
          status.source[status.i + 3] === "-"
        ) {
          // It's a comment, swallow it
          status.i = status.source.indexOf("-->", status.i) + 3;
        } else {
          // It's a child element
          const child = parseElement(status);
          element.children.push(child);
        }
      } else if (char === "@") {
        const nextChars = status.source.substring(status.i, status.i + 3);
        if (nextChars === "@//") {
          // Swallow one-line comments
          status.i = status.source.indexOf("\n", status.i) + 1;
        } else if (nextChars === "@/*") {
          // Swallow multi-line comments
          status.i = status.source.indexOf("*/", status.i) + 2;
        } else {
          // It's a control statement
          const child = parseControl(status);
          wrangleControl(child, element);
        }
        /*
      } else if (char === "}") {
        // Check for an else
        const end = status.i;
        status.i += 1;
        consumeSpace(status);
        if (accept("else", status, false)) {
          const child = parseControl(status, "@each");
          element.children.push(child);
        } else {
          status.i = end;
        }
        */
      } else {
        // It's text content
        const start = status.i;
        const end = status.source.indexOf("<", status.i + 1);
        if (end !== -1) {
          const content = status.source.substring(start, end).trimEnd();
          if (content) {
            const text: TextNode = {
              type: "text",
              content,
            };
            element.children.push(text);
          }
          const spaceContent = status.source.substring(start + content.length, end);
          if (spaceContent) {
            const space: TextNode = {
              type: "space",
              content: spaceContent,
            };
            element.children.push(space);
          }
          // Rewind to the < so that it will get checked in the next loop, above
          status.i = end - 1;
        }
      }
    }
  }

  return element;
}

function parseTagOpen(status: ParseStatus): ElementNode {
  accept("<", status);

  consumeSpace(status);
  let special = accept(":", status);
  let tagName = consumeWord(status);
  consumeSpace(status);

  const element: ElementNode = {
    type: "element",
    tagName,
    attributes: [],
    children: [],
  };

  if (special) {
    element.type = "special";
    element.tagName = ":" + element.tagName;
  }

  if (accept(">", status)) {
    // Don't need to do anything
  } else if (accept("/>", status)) {
    element.selfClosed = true;
  } else {
    parseTagAttributes(element, status);
  }

  return element;
}

function parseTagAttributes(element: ElementNode, status: ParseStatus) {
  for (status.i; status.i < status.source.length; status.i++) {
    const char = status.source[status.i];
    if (char === "/") {
      element.selfClosed = true;
      status.i += 2;
      return;
    } else if (char === ">") {
      status.i += 1;
      return;
    } else if (!isSpaceChar(status.source, status.i)) {
      const attribute = parseAttribute(status);
      element.attributes.push(attribute);
    }
  }
}

function parseAttribute(status: ParseStatus): Attribute {
  let name = consumeUntil("= \t\r\n/>", status);
  const attribute: Attribute = {
    name,
    value: "",
  };
  consumeSpace(status);
  if (accept("=", status)) {
    consumeSpace(status);
    attribute.value = parseAttributeValue(status);
  }
  // HACK: Really have to sort out this parsing stuff
  const char = status.source[status.i];
  if (char === "/" || char === ">" || char === "{") {
    status.i -= 1;
  }
  return attribute;
}

function parseAttributeValue(status: ParseStatus): string {
  const start = status.i;
  const startChar = status.source[status.i];
  let braceCount = 0;
  status.i++;
  for (status.i; status.i < status.source.length; status.i++) {
    const char = status.source[status.i];
    if (startChar === '"' || startChar === "'") {
      if (char === startChar) {
        //status.i++;
        return status.source.substring(start, status.i + 1);
      }
    } else if (startChar === "{") {
      if (char === "{") {
        braceCount += 1;
      } else if (char === "}") {
        if (braceCount === 0) {
          //status.i++;
          return status.source.substring(start, status.i + 1);
        } else {
          braceCount -= 1;
        }
      } else if (char === '"' || char === "'" || char === "`") {
        // Ignore the content of strings
        status.i += 1;
        for (status.i; status.i < status.source.length; status.i++) {
          if (status.source[status.i] === char && status.source[status.i - 1] !== "\\") {
            break;
          }
        }
      } else if (char === "/") {
        const nextChar = status.source[status.i + 1];
        if (nextChar === "/") {
          // Ignore the content of one-line comments
          status.i += 2;
          for (status.i; status.i < status.source.length; status.i++) {
            if (status.source[status.i] === "\n") {
              break;
            }
          }
        } else if (nextChar === "*") {
          // Ignore the content of multiple-line comments
          status.i += 2;
          for (status.i; status.i < status.source.length; status.i++) {
            if (status.source[status.i] === "/" && status.source[status.i - 1] === "*") {
              break;
            }
          }
        } else if (nextChar === ">") {
          // HACK: Go back to the start of the slash so that it gets parsed in parseTagAttributes
          status.i -= 1;
          return status.source.substring(start, status.i);
        }
      }
    } else {
      if (char === ">" || isSpaceChar(status.source, status.i)) {
        // HACK: Go back to the start of the > so that it gets parsed in parseTagAttributes
        status.i -= 1;
        return status.source.substring(start, status.i + 1);
      }
    }
  }

  return "";
}

function parseControl(status: ParseStatus): ControlNode {
  const node = parseControlOpen(status);

  // Consts and keys can't have children
  if (node.operation === "@const" || node.operation === "@key") {
    return node;
  }

  // Get the children
  for (status.i; status.i < status.source.length; status.i++) {
    addSpaceElement(node, status);
    const char = status.source[status.i];
    if (char === "}") {
      // It's the end of the control block, so we're done here
      break;
    } else if (char === "<") {
      // It's a child element
      const child = parseElement(status);
      node.children.push(child);
    } else if (char === "@") {
      const nextChars = status.source.substring(status.i, status.i + 3);
      if (nextChars === "@//") {
        // Swallow one-line comments
        status.i = status.source.indexOf("\n", status.i) + 1;
      } else if (nextChars === "@/*") {
        // Swallow multi-line comments
        status.i = status.source.indexOf("*/", status.i) + 2;
      } else {
        // It's some control
        const child = parseControl(status);
        wrangleControl(child, node);
      }
    } else {
      // Can't have text content in control blocks
      addError(status, `Unexpected token in control block: ${char}`, status.i);
    }
  }

  return node;
}

function parseControlOpen(status: ParseStatus): ControlNode {
  const start = status.i;
  let operation = "";
  for (status.i; status.i < status.source.length; status.i++) {
    if (isSpaceChar(status.source, status.i)) {
      operation = status.source.substring(start, status.i);
      break;
    }
  }

  // HACK:
  if (operation === "@default:") {
    operation = "@default";
  }

  const node: ControlNode = {
    type: "control",
    operation,
    statement: "",
    children: [],
  };

  if (controlOperations.includes(operation)) {
    // TODO: Ignore chars in strings, comments and parentheses
    let parenCount = 0;
    for (status.i; status.i < status.source.length; status.i++) {
      const char = status.source[status.i];
      if (char === "(") {
        parenCount += 1;
      } else if (char === ")") {
        parenCount -= 1;
      } else if (char === "{") {
        if (parenCount === 0) {
          node.statement = status.source.substring(start + 1, status.i).trim();
          status.i += 1;
          break;
        }
      } else if (char === "\n" && (operation === "@const" || operation === "@key")) {
        if (parenCount === 0) {
          node.statement = status.source.substring(start + 1, status.i).trim();
          status.i += 1;
          break;
        }
      }
    }
  } else {
    // TODO: Should probably advance until a lt
    addError(status, `Unknown operation: ${node.operation}`, status.i);
  }

  return node;
}

function wrangleControl(control: ControlNode, parentNode: ElementNode | ControlNode) {
  // HACK: Wrangle if/then/else into an if group and await/then/catch into an await group
  if (control.operation === "@if") {
    const ifGroup: ControlNode = {
      type: "control",
      operation: "@if group",
      statement: "",
      children: [control],
    };
    parentNode.children.push(ifGroup);
  } else if (control.operation === "@else") {
    if (/^else\s+if/.test(control.statement)) {
      control.operation = "@else if";
    }
    for (let i = parentNode.children.length - 1; i >= 0; i--) {
      const lastChild = parentNode.children[i];
      // TODO: Break if it's an element, do more checking
      if (lastChild.type === "control" && (lastChild as ControlNode).operation === "@if group") {
        (lastChild as ControlNode).children.push(control);
        break;
      }
    }
  } else if (control.operation === "@await") {
    const awaitGroup: ControlNode = {
      type: "control",
      operation: "@await group",
      statement: "",
      children: [control],
    };
    parentNode.children.push(awaitGroup);
  } else if (control.operation === "@then" || control.operation === "@catch") {
    for (let i = parentNode.children.length - 1; i >= 0; i--) {
      const lastChild = parentNode.children[i];
      // TODO: Break if it's an element, do more checking
      if (lastChild.type === "control" && (lastChild as ControlNode).operation === "@await group") {
        (lastChild as ControlNode).children.push(control);
        break;
      }
    }
  } else {
    parentNode.children.push(control);
  }
}

function addSpaceElement(parent: ElementNode | ControlNode, status: ParseStatus) {
  const content = consumeSpace(status);
  if (content) {
    const space: TextNode = {
      type: "space",
      content,
    };
    parent.children.push(space);
  }
}

function extractElementText(tagName: string, status: ParseStatus): string {
  const start = status.i;
  const closeTag = `</${tagName}>`;
  for (status.i; status.i < status.source.length; status.i++) {
    const char = status.source[status.i];
    if (
      char === "<" &&
      status.source.substring(status.i, status.i + closeTag.length) === closeTag
    ) {
      // Return on </script>
      const result = status.source.substring(start, status.i).trim();
      status.i += closeTag.length - 1;
      return result;
    } else if (char === '"' || char === "'" || char === "`") {
      // Ignore the content of strings
      status.i += 1;
      for (status.i; status.i < status.source.length; status.i++) {
        if (status.source[status.i] === char && status.source[status.i - 1] !== "\\") {
          break;
        }
      }
    } else if (char === "/") {
      const nextChar = status.source[status.i + 1];
      if (nextChar === "/") {
        // Ignore the content of one-line comments
        status.i += 2;
        for (status.i; status.i < status.source.length; status.i++) {
          if (status.source[status.i] === "\n") {
            break;
          }
        }
      } else if (nextChar === "*") {
        // Ignore the content of multiple-line comments
        status.i += 2;
        for (status.i; status.i < status.source.length; status.i++) {
          if (status.source[status.i] === "/" && status.source[status.i - 1] === "*") {
            break;
          }
        }
      }
    }
  }
  addError(status, `Unclosed ${tagName} element`, start);
  return "";
}

function extractScriptImports(status: ParseStatus) {
  if (status.script) {
    let start = 0;
    for (let i = 0; i < status.script.length + 1; i++) {
      if (status.script[i] === "\n" || status.script[i] === undefined) {
        const line = status.script.substring(start, i).trim();
        if (line.length) {
          if (line.startsWith("import ")) {
            status.imports = status.imports || [];
            const importRegex = /import\s+(.+?)\s+from\s+([^;\n]+)/g;
            const importMatches = line.matchAll(importRegex);
            for (let match of importMatches) {
              const name = match[1];
              const path = trimQuotes(match[2]);
              const componentRegex = /\.tera$/gm;
              status.imports.push({
                name,
                path,
                component: componentRegex.test(path),
              });
            }
          } else {
            // Imports are done!
            // TODO: Make sure there aren't any more with a regex
            break;
          }
        }
        start = i + 1;
      }
    }
    if (status.imports) {
      status.script = status.script.substring(start).trim();
    }
  }
}

function parseChildTemplate(name: string, source: string, status: ParseStatus) {
  const parsed = parse(source);
  if (parsed.ok && parsed.parts) {
    parsed.parts.name = name;
    status.childTemplates = status.childTemplates || [];
    status.childTemplates.push(parsed.parts);
    if (status.template) {
      setChildComponentNodes(name, status.template);
    }
  } else {
    status.errors = status.errors.concat(parsed.errors);
  }
}

function setChildComponentNodes(name: string, node: Node) {
  if (node.type === "element" && (node as ElementNode).tagName === name) {
    node.type = "component";
  }
  if (node.type === "element" || node.type == "control") {
    for (let child of (node as ElementNode).children) {
      setChildComponentNodes(name, child);
    }
  }
}

interface StyleStatus {
  source: string;
  i: number;
  errors: CompileError[];
}

function parseStyleElement(status: ParseStatus): Style {
  const style: Style = {
    global: false,
    blocks: [],
  };

  // Extract the content between the style tags without comments
  const source = getStyleSource(status).trim();
  status.styleHash = hash(source);

  const styleStatus: StyleStatus = {
    source,
    i: 0,
    errors: [],
  };

  for (styleStatus.i; styleStatus.i < styleStatus.source.length; styleStatus.i++) {
    consumeSpace(styleStatus);
    const block = parseStyleBlock(styleStatus);
    style.blocks.push(block);
  }

  status.errors = status.errors.concat(styleStatus.errors);

  return style;
}

function getStyleSource(status: ParseStatus): string {
  const start = status.i;

  let style = "";
  for (status.i; status.i < status.source.length; status.i++) {
    const char = status.source[status.i];
    if (char === "<" && status.source.substring(status.i, status.i + 8) === "</style>") {
      status.i += 8;
      return style;
    } else if (char === "/") {
      const nextChar = status.source[status.i + 1];
      if (nextChar === "/") {
        // Ignore the content of one-line comments
        status.i += 2;
        for (status.i; status.i < status.source.length; status.i++) {
          if (status.source[status.i] === "\n") {
            break;
          }
        }
      } else if (nextChar === "*") {
        // Ignore the content of multiple-line comments
        status.i += 2;
        for (status.i; status.i < status.source.length; status.i++) {
          if (status.source[status.i] === "/" && status.source[status.i - 1] === "*") {
            break;
          }
        }
      }
    } else {
      style += char;
    }
  }

  addError(status, "Unclosed style element", start);
  return "";
}

function parseStyleBlock(status: ParseStatus): StyleBlock {
  const selector = consumeUntil("{", status).trim();
  accept("{", status);
  const block: StyleBlock = {
    selector,
    attributes: [],
    children: [],
  };
  consumeSpace(status);
  while (status.source[status.i] !== "}") {
    // HACK: Is it an attribute or a child block?
    let nextColon = status.source.indexOf(":", status.i);
    if (nextColon === -1) nextColon = status.source.length;
    let nextOpenBrace = status.source.indexOf("{", status.i);
    if (nextOpenBrace === -1) nextOpenBrace = status.source.length;
    if (nextColon < nextOpenBrace) {
      const attribute = parseStyleAttribute(status);
      block.attributes.push(attribute);
    } else if (nextOpenBrace < nextColon) {
      const child = parseStyleBlock(status);
      block.children.push(child);
    }
    consumeSpace(status);
  }
  accept("}", status);
  return block;
}

function parseStyleAttribute(status: ParseStatus): Attribute {
  const name = consumeUntil(":", status).trim();
  accept(":", status);
  const value = consumeUntil(";", status).trim();
  accept(";", status);
  const attribute: Attribute = {
    name,
    value,
  };
  return attribute;
}

function checkAndApplyStyles(status: ParseStatus) {
  let selectors: string[] = [];
  if (status.style && status.styleHash && status.template) {
    for (let block of status.style.blocks) {
      collectStyleSelectors(block, selectors);
    }
    checkAndApplyStylesOnNode(status.template, selectors, status.styleHash);
  }
}

function checkAndApplyStylesOnNode(node: Node, selectors: string[], styleHash: string) {
  if (node.type === "element") {
    const element = node as ElementNode;
    let addClass = false;
    addClass =
      addClass ||
      !!element.attributes.find((a) => a.name === "class" || a.name.startsWith("class:"));
    addClass = addClass || selectors.includes(element.tagName);
    if (!addClass) {
      for (let a of element.attributes) {
        if (a.name === "id") {
          addClass = selectors.includes(`#${trimQuotes(a.value)}`);
        } else if (a.name === "class") {
          addClass = selectors.includes(`.${trimQuotes(a.value)}`);
        }
        if (addClass) break;
      }
    }
    if (addClass) {
      element.attributes.push({
        name: "class",
        value: `"tera-${styleHash}"`,
      });
    }
  }

  if (node.type === "element" || node.type === "control") {
    for (let child of (node as ElementNode).children) {
      checkAndApplyStylesOnNode(child, selectors, styleHash);
    }
  }
}

function collectStyleSelectors(block: StyleBlock, selectors: string[]) {
  // HACK: We should be collecting the actual selectors and then checking attributes, parents, children, siblings etc
  for (let s of block.selector.split(/[\s*,>+~]/)) {
    selectors.push(s);
  }
}

function parseDocs(status: ParseStatus): Documentation {
  const docs: Documentation = {
    description: "",
    props: [],
    slots: [],
  };

  while (accept("*", status)) {
    consumeSpace(status);
    if (accept("/", status)) {
      // It is the end of the comments
      break;
    } else if (accept("@", status)) {
      const key = consumeWord(status);
      switch (key) {
        case "prop": {
          const prop = parseDocsProp(status);
          docs.props.push(prop);
          break;
        }
        case "slot": {
          const slot = parseDocsSlot(status);
          docs.slots.push(slot);
          break;
        }
        default: {
          addError(status, `Unknown keyword: ${key}`, status.i - key.length - 1);
          break;
        }
      }
    } else if (status.i === status.source.length - 1) {
      addError(status, "Unclosed doc comments", status.i);
      break;
    } else {
      docs.description += consumeUntil("\n*@", status).trim();
      consumeSpace(status);
    }
  }

  return docs;
}

function parseDocsProp(status: ParseStatus): PropDocumentation {
  const docs: PropDocumentation = {
    name: "",
    type: "",
    description: "",
  };

  // Parse the type
  consumeSpace(status);
  if (accept("{", status)) {
    consumeSpace(status);
    docs.type = consumeWord(status);
    consumeSpace(status);
    expect("}", status);
    consumeSpace(status);
  }

  // Parse the name
  docs.name = consumeWord(status);
  consumeSpace(status);

  // Maybe parse the description
  if (!accept("*", status, false)) {
    // Ignore leading dashes
    while (accept("-", status)) {}
    docs.description = consumeUntil("\n", status).trim();
    consumeSpace(status);
  }

  while (accept("*", status)) {
    const start = status.i - 1;
    consumeSpace(status);
    if (accept("*", status)) {
      // It was an empty line; move on to the next
      status.i -= 1;
      continue;
    } else if (accept("/", status) || accept("@", status)) {
      // It's the end of the comments or this prop
      status.i = start;
      break;
    } else {
      // Ignore leading dashes
      while (accept("-", status)) {}
      docs.description += consumeUntil("\n", status).trim();
      consumeSpace(status);
    }
  }

  return docs;
}

function parseDocsSlot(status: ParseStatus): SlotDocumentation {
  const docs: SlotDocumentation = {
    name: "",
    props: [],
  };

  consumeSpace(status);

  // Maybe parse the name
  if (!accept("*", status, false)) {
    docs.name = consumeUntil("\n", status);
    consumeSpace(status);
  }

  while (accept("*", status)) {
    const start = status.i - 1;
    consumeSpace(status);
    if (accept("*", status)) {
      // It was an empty line; move on to the next
      status.i -= 1;
      continue;
    } else if (accept("@sprop", status)) {
      // Process @sprop
      const prop = parseDocsProp(status);
      docs.props.push(prop);
    } else if (accept("/", status) || accept("@", status)) {
      // It's the end of the comments or this slot
      status.i = start;
      break;
    }
  }

  return docs;
}

function addError(status: ParseStatus, message: string, start: number = status.i) {
  status.errors.push({ message, start });
}

function consumeSpace(status: ParseStatus): string {
  const start = status.i;
  for (status.i; status.i < status.source.length; status.i++) {
    if (!isSpaceChar(status.source, status.i)) {
      return status.source.substring(start, status.i);
    }
  }
  return "";
}

function consumeNonSpace(status: ParseStatus): string {
  const start = status.i;
  for (status.i; status.i < status.source.length; status.i++) {
    if (isSpaceChar(status.source, status.i)) {
      return status.source.substring(start, status.i);
    }
  }
  return "";
}

function consumeWord(status: ParseStatus): string {
  const start = status.i;
  for (status.i; status.i < status.source.length; status.i++) {
    if (!isAlphaNumericChar(status.source, status.i)) {
      return status.source.substring(start, status.i);
    }
  }
  return "";
}

function consumeUntil(value: string, status: ParseStatus) {
  const start = status.i;
  for (status.i; status.i < status.source.length; status.i++) {
    if (value.includes(status.source[status.i])) {
      return status.source.substring(start, status.i);
    }
  }
  return "";
}

function accept(value: string, status: ParseStatus, advance = true): boolean {
  const check = status.source.substring(status.i, status.i + value.length);
  if (check == value) {
    status.i += advance ? value.length : 0;
    return true;
  }
  return false;
}

function expect(value: string, status: ParseStatus, advance = true): boolean {
  if (status.i < status.source.length) {
    if (status.source.substring(status.i, status.i + value.length) == value) {
      status.i += advance ? value.length : 0;
      return true;
    } else {
      addError(status, `Expected ${value}`);
    }
  } else {
    addError(status, "Expected token");
  }
  return false;
}
