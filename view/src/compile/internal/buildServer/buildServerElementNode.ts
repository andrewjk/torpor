import type ElementNode from "../../types/nodes/ElementNode";
import { trimMatched, trimQuotes } from "../utils";
import Builder from "./Builder";
import buildNode from "./buildServerNode";

export default function buildServerElementNode(node: ElementNode, b: Builder, root = false) {
  let attributes = buildElementAttributes(node);
  if (attributes.length) {
    attributes = " " + attributes;
  }
  b.append(`$output += \`<${node.tagName}${attributes}${node.selfClosed ? "/" : ""}>\`;`);
  if (!node.selfClosed) {
    for (let child of node.children) {
      buildNode(child, b);
    }
    b.append(`$output += "</${node.tagName}>";`);
  }
}

function buildElementAttributes(node: ElementNode) {
  let attributes: string[] = [];
  for (let { name, value } of node.attributes) {
    if (name.startsWith("{") && name.endsWith("}")) {
      name = name.substring(1, name.length - 1);
      attributes.push(`${name}="\${${name}}"`);
    } else if (name.startsWith("on")) {
      // No events on the server
    } else if (value.startsWith("{") && value.endsWith("}")) {
      value = value.substring(1, value.length - 1);

      if (name.startsWith("bind:")) {
        // TODO: need to check the element to find out what type of event to add
        let defaultValue = '""';
        let typeAttribute = node.attributes.find((a) => a.name === "type");
        let inputValue = "e.target.value";
        if (typeAttribute) {
          if (trimQuotes(typeAttribute.value) === "number") {
            defaultValue = "0";
            inputValue = "Number(e.target.value)";
          }
        }
        let set = `${value} || ${defaultValue}`;
        const propName = name.substring(5);
        attributes.push(`${propName}="\${${set}}"`);
      } else if (name.startsWith("class:")) {
        // TODO: Collect all the classes that are true and add them at the end
        const className = name.substring(6);
        attributes.push(`${className}="${value}"`);
      } else {
        attributes.push(`${name}="${value}"`);
      }
    }
  }
  return attributes.join(" ");
}
