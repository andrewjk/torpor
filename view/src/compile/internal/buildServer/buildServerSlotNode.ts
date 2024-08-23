import type ElementNode from "../../types/nodes/ElementNode";
import isSpecialNode from "../../types/nodes/isSpecialNode";
import Builder from "../Builder";
import { trimQuotes } from "../utils";
import BuildServerStatus from "./BuildServerStatus";
import buildServerNode from "./buildServerNode";
import { nextVarName } from "./buildServerUtils";

export default function buildServerSlotNode(
  node: ElementNode,
  status: BuildServerStatus,
  b: Builder,
) {
  // Surround the entire control statement with bracketed comments, so that we
  // can skip to the end to set the anchor node when hydrating
  status.output += "<![>";

  if (status.output) {
    b.append(`$output += \`${status.output}\`;`);
    status.output = "";
  }

  // If there's a slot, build that, otherwise build the default nodes
  let slotName = node.attributes.find((a) => a.name === "name")?.value;
  slotName = slotName ? trimQuotes(slotName) : "_";

  // Slot props
  const propsName = nextVarName("sprops", status);
  const slotAttributes = node.attributes.filter((a) => a.name !== "name");
  const slotHasProps = slotAttributes.length;
  if (slotHasProps) {
    // TODO: defaults etc props
    b.append(`const ${propsName} = {};`);
    for (let { name, value } of slotAttributes) {
      if (name.startsWith("{") && name.endsWith("}")) {
        name = name.substring(1, name.length - 1);
        b.append(`${propsName}["${name}"] = ${name};`);
      } else {
        let reactive = value.startsWith("{") && value.endsWith("}");
        if (reactive) {
          value = value.substring(1, value.length - 1);
        }
        b.append(`${propsName}["${name}"] = ${value};`);
      }
    }
  }

  b.append(`if ($slots && $slots["${slotName}"]) {`);
  b.append(`$output += $slots["${slotName}"](${slotHasProps ? propsName : "undefined"});`);

  // TODO: Not if there's only a single space node -- maybe check in parse
  const fill = node.children.find((c) => isSpecialNode(c) && c.tagName === ":fill");
  if (fill && isSpecialNode(fill) && fill.children.length) {
    b.append(`} else {`);

    for (let child of fill.children) {
      buildServerNode(child, status, b);
    }

    if (status.output) {
      b.append(`$output += \`${status.output}\`;`);
      status.output = "";
    }
  }

  b.append(`}`);

  // End the control statement
  status.output += "<!]>";

  // Add the anchor node
  status.output += "<!>";
}
