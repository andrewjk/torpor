import ElementNode from "../nodes/ElementNode";
import LogicNode from "../nodes/LogicNode";
import Node from "../nodes/Node";
import TextNode from "../nodes/TextNode";
import Attribute from "../types/Attribute";
import CompileError from "../types/CompileError";
import Import from "../types/Import";
import ParseResult from "../types/ParseResult";
import Style from "../types/Style";
import StyleBlock from "../types/StyleBlock";
import hash from "./hash";
import { isAlphaNumericChar, isSpaceChar, trimAny } from "./utils";

interface ParseStatus {
  source: string;
  // The current index
  i: number;
  script?: string;
  template?: ElementNode;
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

const logicalOperations = [
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

  const ok = !status.errors.length;
  return {
    ok,
    errors: status.errors,
    parts: ok
      ? {
          imports: status.imports,
          script: status.script,
          template: status.template,
          style: status.style,
          styleHash: status.styleHash,
        }
      : undefined,
  };
}

function parseSource(status: ParseStatus, source: string) {
  // HACK: The laziest way to handle elses etc:
  status.source = status.source
    .replace(/}(\s*)else/g, "}$1@else")
    .replace(/}(\s*)then/g, "}$1@then")
    .replace(/}(\s*)catch/g, "}$1@catch");

  for (status.i; status.i < source.length; status.i++) {
    if (status.source[status.i] === "<") {
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
    }
  }
}

function parseTopElement(status: ParseStatus) {
  const start = status.i;
  const element = parseTagOpen(status);
  switch (element.tagName) {
    case "script": {
      if (!element.selfClosed) {
        status.script = parseScriptElement(status);
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
  if (status.imports?.find((i) => i.component && i.name === element.tagName)) {
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
          // It's some logic
          const child = parseLogic(status);
          wrangleLogic(child, element);
        }
        /*
      } else if (char === "}") {
        // Check for an else
        const end = status.i;
        status.i += 1;
        consumeSpace(status);
        if (accept("else", status, false)) {
          const child = parseLogic(status, "@each");
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
  const tagName = consumeWord(status);
  consumeSpace(status);

  const element: ElementNode = {
    type: "element",
    tagName,
    attributes: [],
    children: [],
  };

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
      //consumeSpace(status);
    }
  }
}

function parseAttribute(status: ParseStatus): Attribute {
  const name = consumeWord(status);
  const attribute: Attribute = {
    name,
    value: "",
  };
  consumeSpace(status);
  if (accept("=", status)) {
    consumeSpace(status);
    attribute.value = parseAttributeValue(status);
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

function parseLogic(status: ParseStatus): LogicNode {
  const node = parseLogicOpen(status);

  // Consts and keys can't have children
  if (node.operation === "@const" || node.operation === "@key") {
    return node;
  }

  // Get the children
  for (status.i; status.i < status.source.length; status.i++) {
    addSpaceElement(node, status);
    const char = status.source[status.i];
    if (char === "}") {
      // It's the end of the logic block, so we're done here
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
        // It's some logic
        const child = parseLogic(status);
        wrangleLogic(child, node);
      }
    } else {
      // Can't have text content in logic blocks
      addError(status, `Unexpected token in logic block: ${char}`, status.i);
    }
  }

  return node;
}

function parseLogicOpen(status: ParseStatus): LogicNode {
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

  const node: LogicNode = {
    type: "logic",
    operation,
    logic: "",
    children: [],
  };

  if (logicalOperations.includes(operation)) {
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
          node.logic = status.source.substring(start + 1, status.i).trim();
          status.i += 1;
          break;
        }
      } else if (char === "\n" && (operation === "@const" || operation === "@key")) {
        if (parenCount === 0) {
          node.logic = status.source.substring(start + 1, status.i).trim();
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

function wrangleLogic(logic: LogicNode, parentNode: ElementNode | LogicNode) {
  // HACK: Wrangle if/then/else into an if group and await/then/catch into an await group
  if (logic.operation === "@if") {
    const ifGroup: LogicNode = {
      type: "logic",
      operation: "@if group",
      logic: "",
      children: [logic],
    };
    parentNode.children.push(ifGroup);
  } else if (logic.operation === "@else") {
    if (/^else\s+if/.test(logic.logic)) {
      logic.operation = "@else if";
    }
    for (let i = parentNode.children.length - 1; i >= 0; i--) {
      const lastChild = parentNode.children[i];
      // TODO: Break if it's an element, do more checking
      if (lastChild.type === "logic" && (lastChild as LogicNode).operation === "@if group") {
        (lastChild as LogicNode).children.push(logic);
        break;
      }
    }
  } else if (logic.operation === "@await") {
    const awaitGroup: LogicNode = {
      type: "logic",
      operation: "@await group",
      logic: "",
      children: [logic],
    };
    parentNode.children.push(awaitGroup);
  } else if (logic.operation === "@then" || logic.operation === "@catch") {
    for (let i = parentNode.children.length - 1; i >= 0; i--) {
      const lastChild = parentNode.children[i];
      // TODO: Break if it's an element, do more checking
      if (lastChild.type === "logic" && (lastChild as LogicNode).operation === "@await group") {
        (lastChild as LogicNode).children.push(logic);
        break;
      }
    }
  } else {
    parentNode.children.push(logic);
  }
}

function addSpaceElement(parent: ElementNode | LogicNode, status: ParseStatus) {
  const content = consumeSpace(status);
  if (content) {
    const space: TextNode = {
      type: "space",
      content,
    };
    parent.children.push(space);
  }
}

function parseScriptElement(status: ParseStatus): string {
  const start = status.i;
  for (status.i; status.i < status.source.length; status.i++) {
    const char = status.source[status.i];
    if (char === "<" && status.source.substring(status.i, status.i + 9) === "</script>") {
      // Return on </script>
      const script = status.source.substring(start, status.i).trim();
      status.i += 9;
      return script;
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
  addError(status, "Unclosed script element", start);
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
              const path = trimAny(match[2], `'"`);
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
    let addClass = selectors.includes(element.tagName);
    if (!addClass) {
      for (let a of element.attributes) {
        if (a.name === "id") {
          addClass = selectors.includes(`#${trimAny(a.value, `'"`)}`);
        } else if (a.name === "class") {
          addClass = selectors.includes(`.${trimAny(a.value, `'"`)}`);
        }
        if (addClass) break;
      }
    }
    if (addClass) {
      element.attributes.push({
        name: "class",
        value: `tera-${styleHash}`,
      });
    }
  }

  if (node.type === "element" || node.type === "logic") {
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

function consumeUntil(char: string, status: ParseStatus) {
  const start = status.i;
  for (status.i; status.i < status.source.length; status.i++) {
    if (status.source[status.i] === char) {
      return status.source.substring(start, status.i);
    }
  }
  return "";
}

function accept(value: string, status: ParseStatus, advance = true): boolean {
  const check = status.source.substring(status.i, status.i + value.length);
  if (status.source.substring(status.i, status.i + value.length) == value) {
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
