import ElementNode from "../src/nodes/ElementNode";
import LogicNode from "../src/nodes/LogicNode";
import Node from "../src/nodes/Node";
import TextNode from "../src/nodes/TextNode";
import Attribute from "../src/types/Attribute";
import ParseResult from "../src/types/ParseResult";

export function el(tagName: string, attributes?: Attribute[], children?: Node[]): ElementNode {
  return {
    type: "element",
    tagName,
    attributes: attributes || [],
    children: children || [],
  };
}

export function logic(operation: string, logic: string, children?: Node[]): LogicNode {
  return {
    type: "logic",
    operation,
    logic,
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
  if (result.syntaxTree?.template) {
    trimElement(result.syntaxTree.template as ElementNode);
  }
  return result;
}

function trimElement(el: ElementNode | LogicNode) {
  for (let i = el.children.length - 1; i >= 0; i--) {
    const child = el.children[i];
    if (child.type === "space") {
      el.children.splice(i, 1);
    } else if (child.type === "element" || child.type === "logic") {
      // HACK:
      trimElement(child as ElementNode);
    }
  }
}
