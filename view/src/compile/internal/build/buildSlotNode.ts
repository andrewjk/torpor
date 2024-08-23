import type ElementNode from "../../types/nodes/ElementNode";
import Builder from "../Builder";
import { trimQuotes } from "../utils";
import type BuildStatus from "./BuildStatus";
import addFragment from "./buildAddFragment";
import buildFragment from "./buildFragment";
import buildNode from "./buildNode";
import buildRun from "./buildRun";
import { nextVarName } from "./buildUtils";

export default function buildSlotNode(
  node: ElementNode,
  status: BuildStatus,
  b: Builder,
  parentName: string,
  anchorName: string,
) {
  // If there's a slot, build that, otherwise build the default nodes
  let slotName = node.attributes.find((a) => a.name === "name")?.value;
  slotName = slotName ? trimQuotes(slotName) : "_";

  // Slot props
  const propsName = nextVarName("sprops", status);
  const slotAttributes = node.attributes.filter((a) => a.name !== "name");
  const slotHasProps = slotAttributes.length;
  if (slotHasProps) {
    // TODO: defaults etc props
    status.imports.add("$watch");
    b.append(`const ${propsName} = $watch({});`);
    for (let { name, value } of slotAttributes) {
      if (name.startsWith("{") && name.endsWith("}")) {
        name = name.substring(1, name.length - 1);
        //b.append(`$run(() => ${propsName}["${name}"] = ${name});`);
        buildRun("setProp", `${propsName}["${name}"] = ${name});`, status, b);
      } else {
        let reactive = value.startsWith("{") && value.endsWith("}");
        if (reactive) {
          value = value.substring(1, value.length - 1);
        }
        const setProp = `${propsName}["${name}"] = ${value}`;
        //b.append(reactive ? `$run(() => ${setProp});` : `${setProp};`);
        if (reactive) {
          buildRun("setProp", `${setProp};`, status, b);
        } else {
          b.append(`${setProp};`);
        }
      }
    }
  }

  const slotParentName = node.parentName!;
  const slotAnchorName = node.varName!;

  b.append(`if ($slots && $slots["${slotName}"]) {`);
  b.append(
    `$slots["${slotName}"](${slotParentName}, ${slotAnchorName}, ${slotHasProps ? propsName : "undefined"})`,
  );

  // TODO: Not if there's only a single space node -- maybe check in parse
  if (node.children.length) {
    b.append(`} else {`);

    // HACK: Change the node from :slot to :fill now that we want the content to be created
    // Otherwise we would just keep infinitely creating anchors
    // It would probably be better to wrangle a new :fill node under the :slot?
    node.tagName = ":fill";

    buildFragment(node, status, b, slotParentName, slotAnchorName);

    status.fragmentStack.push({
      fragment: node.fragment,
      path: "0:ch/",
    });
    for (let child of node.children) {
      buildNode(child, status, b, slotParentName, slotAnchorName);
    }
    status.fragmentStack.pop();

    addFragment(node, status, b, slotParentName, slotAnchorName);
  }

  b.append(`}`);
}
