import ControlNode from "../src/nodes/ControlNode";
import ElementNode from "../src/nodes/ElementNode";
import Node from "../src/nodes/Node";
import TextNode from "../src/nodes/TextNode";
import Attribute from "../src/types/Attribute";
import ParseResult from "../src/types/ParseResult";

export function cmp(
  name: string,
  attributes?: Attribute[],
  children?: Node[],
  selfClosed?: boolean,
): ElementNode {
  return {
    type: "component",
    tagName: name,
    attributes: attributes || [],
    children: children || [],
    selfClosed,
  };
}

export function el(
  tagName: string,
  attributes?: Attribute[],
  children?: Node[],
  selfClosed?: boolean,
): ElementNode {
  return {
    type: "element",
    tagName,
    attributes: attributes || [],
    children: children || [],
    selfClosed,
  };
}

export function sp(
  name: string,
  attributes?: Attribute[],
  children?: Node[],
  selfClosed?: boolean,
): ElementNode {
  return {
    type: "special",
    tagName: name,
    attributes: attributes || [],
    children: children || [],
    selfClosed,
  };
}

export function control(operation: string, statement: string, children?: Node[]): ControlNode {
  return {
    type: "control",
    operation,
    statement,
    children: children || [],
  };
}

export function text(content: string): TextNode {
  return {
    type: "text",
    content,
  };
}

export function att(name: string, value: string): Attribute {
  return {
    name,
    value,
  };
}

export function space(content: string): TextNode {
  return {
    type: "space",
    content,
  };
}

export function trimParsed(result: ParseResult): ParseResult {
  if (result.parts?.template) {
    trimElement(result.parts.template as ElementNode);
  }
  if (result.parts?.styleHash) {
    result.parts.styleHash = undefined;
  }
  return result;
}

function trimElement(el: ElementNode | ControlNode) {
  for (let i = el.children.length - 1; i >= 0; i--) {
    const child = el.children[i];
    if (child.type === "space") {
      el.children.splice(i, 1);
    } else if (child.type === "element" || child.type === "control") {
      // HACK:
      trimElement(child as ElementNode);
    }
  }
}

export function trimCode(code: string) {
  //return code.split('\n').filter(l => !l.trim().startsWith("import"))
  return code.replace(/\/\*\*.+\*\/\n/gms, "");
}
