import type ElementNode from "../../types/nodes/ElementNode";
import Builder from "../Builder";
import { trimQuotes } from "../utils";
import BuildServerStatus from "./BuildServerStatus";
import buildServerNode from "./buildServerNode";

export default function buildServerElementNode(
  node: ElementNode,
  status: BuildServerStatus,
  b: Builder,
) {
  let attributes = buildElementAttributes(node);
  if (attributes.length) {
    attributes = " " + attributes;
  }
  status.output += `<${node.tagName}${attributes}${node.selfClosed ? "/" : ""}>`;
  if (!node.selfClosed) {
    for (let child of node.children) {
      buildServerNode(child, status, b);
    }
    status.output += `</${node.tagName}>`;
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
        let defaultValue = '""';
        let typeAttribute = node.attributes.find((a) => a.name === "type");
        if (typeAttribute) {
          switch (trimQuotes(typeAttribute.value)) {
            case "number": {
              defaultValue = "0";
              break;
            }
            case "checkbox": {
              defaultValue = "false";
              break;
            }
          }
        }
        let valueOrDefault = `${value} || ${defaultValue}`;
        const propName = name.substring(5);
        attributes.push(`${propName}="\${${valueOrDefault}}"`);
      } else if (name.startsWith("class:")) {
        // TODO: Collect all the classes that are true and add them at the end
        const className = name.substring(6);
        attributes.push(`${className}="${value}"`);
      } else {
        // Only set the attribute if the value is truthy
        // e.g. `... ${className ? `class="${className}"` : ''} ...`
        attributes.push(`\${${value} ? \`${name}="\${${value}}"\` : ''}`);
      }
    } else {
      // Just set the attribute
      // TODO: Probably check if it's a boolean attribute e.g. disabled
      attributes.push(`${name}="${trimQuotes(value)}"`);
    }
  }
  return attributes.join(" ");
}
