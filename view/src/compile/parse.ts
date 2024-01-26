import ElementNode from "../nodes/ElementNode";
import LogicNode from "../nodes/LogicNode";
import TextNode from "../nodes/TextNode";
import Attribute from "../types/Attribute";
import CompileError from "../types/CompileError";
import ParseResult from "../types/ParseResult";

interface ParseStatus {
  source: string;
  // The current index
  i: number;
  script?: string;
  template?: ElementNode;
  style?: string;
  imports?: string[];
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

  const ok = !status.errors.length;
  return {
    ok,
    errors: status.errors,
    syntaxTree: ok
      ? {
        imports: status.imports,
        script: status.script,
        template: status.template,
        style: status.style,
      }
      : undefined,
  };
}

function parseTopElement(status: ParseStatus) {
  const start = status.i;
  const element = parseTagOpen(status);
  switch (element.tagName) {
    case "script": {
      if (!element.selfClosed) {
        status.script = parseScriptElement(status);
        extractScriptImports(status);
      } else {
        status.script = "";
      }
      break;
    }
    case "style": {
      status.style = element.selfClosed ? "" : parseStyleElement(status);
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
  // TODO: This will infinitely recurse if there's no >
  while (!accept(">", status)) {
    const attribute = parseAttribute(status);
    element.attributes.push(attribute);
    consumeSpace(status);
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
        status.i++;
        return status.source.substring(start, status.i);
      }
    } else if (startChar === "{") {
      if (char === "{") {
        braceCount += 1;
      } else if (char === "}") {
        if (braceCount === 0) {
          status.i++;
          return status.source.substring(start, status.i);
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
        }
      }
    } else {
      if (char === ">" || isSpaceChar(status.source, status.i)) {
        return status.source.substring(start, status.i);
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
            status.imports.push(line);
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

function parseStyleElement(status: ParseStatus): string {
  // TODO: Parse CSS
  const start = status.i;
  for (status.i; status.i < status.source.length; status.i++) {
    const char = status.source[status.i];
    if (char === "<" && status.source.substring(status.i, status.i + 8) === "</style>") {
      const style = status.source.substring(start, status.i).trim();
      status.i += 8;
      return style;
    }
  }
  addError(status, "Unclosed style element", start);
  return "";
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

function consumeWord(status: ParseStatus): string {
  const start = status.i;
  for (status.i; status.i < status.source.length; status.i++) {
    if (!isAlphaNumericChar(status.source, status.i)) {
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

function isSpace(input: string) {
  for (let i = 0; i < input.length; i++) {
    if (!isSpaceChar(input, i)) {
      return false;
    }
  }
  return true;
}

function isSpaceChar(input: string, i: number) {
  let code = input.charCodeAt(i);
  return code === 32 || (code >= 9 && code <= 13);
}

function isAlphaNumericChar(input: string, i: number) {
  let code = input.charCodeAt(i);
  return (
    // 0-9
    (code > 47 && code < 58) ||
    // A-Z
    (code > 64 && code < 91) ||
    // a-z
    (code > 96 && code < 123)
  );
}
