import ParseResult from "../src/types/ParseResult";
import Attribute from "../src/types/nodes/Attribute";
import ControlNode from "../src/types/nodes/ControlNode";
import ElementNode from "../src/types/nodes/ElementNode";
import Node from "../src/types/nodes/Node";
import OperationType from "../src/types/nodes/OperationType";
import TextNode from "../src/types/nodes/TextNode";

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

export function control(
  operation: OperationType,
  statement: string,
  children?: Node[],
): ControlNode {
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

export function trimParsed(result: ParseResult): ParseResult {
  if (result.parts?.template) {
    trimElement(result.parts.template);
  }
  if (result.parts?.styleHash) {
    result.parts.styleHash = undefined;
  }
  return result;
}

function trimElement(el: ElementNode | ControlNode) {
  for (let i = el.children.length - 1; i >= 0; i--) {
    const child = el.children[i];
    if (child.type === "text") {
      const textChild = child as TextNode;
      textChild.content = textChild.content.trim();
      if (!textChild.content) {
        el.children.splice(i, 1);
      }
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
