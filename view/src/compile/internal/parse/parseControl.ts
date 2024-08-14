import type ControlNode from "../../types/nodes/ControlNode";
import type OperationType from "../../types/nodes/OperationType";
import type ParseStatus from "./ParseStatus";
import addSpaceElement from "./addSpaceElement";
import parseElement from "./parseElement";
import { addError, isSpaceChar } from "./parseUtils";
import wrangleControl from "./wrangleControl";

const controlOperations = [
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
  "@const",
  "@console",
  "@debugger",
  "@function",
];

export default function parseControl(status: ParseStatus): ControlNode {
  const node = parseControlOpen(status);

  // Some operations can't have children
  // TODO: Should probably make operations objects with this information
  if (
    node.operation === "@const" ||
    node.operation === "@console" ||
    node.operation === "@debugger" ||
    node.operation === "@function" ||
    node.operation === "@key"
  ) {
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
  if (operation.startsWith("@console.")) {
    status.i -= operation.length + 1;
    operation = "@console";
  }

  const node: ControlNode = {
    type: "control",
    operation: operation as OperationType,
    statement: "",
    children: [],
  };

  // HACK:
  if (operation === "@debugger") {
    node.statement = "debugger";
    return node;
  }
  if (operation === "@function") {
    // TODO: Ignore chars in strings, comments and parentheses
    let braceCount = 0;
    for (status.i; status.i < status.source.length; status.i++) {
      const char = status.source[status.i];
      if (char === "{") {
        braceCount += 1;
      } else if (char === "}") {
        braceCount -= 1;
        if (braceCount === 0) {
          node.statement = status.source.substring(start + 1, status.i + 1).trim();
          status.i += 1;
          break;
        }
      }
    }
    return node;
  }

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
      } else if (
        char === "\n" &&
        (operation === "@const" ||
          operation === "@console" ||
          operation === "@debugger" ||
          operation === "@key")
      ) {
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
