import type ElementNode from "../../types/nodes/ElementNode";
import isSpecialNode from "../../types/nodes/isSpecialNode";
import Builder from "../Builder";
import { trimQuotes } from "../utils";
import type BuildStatus from "./BuildStatus";
import addFragment from "./buildAddFragment";
import buildFragment from "./buildFragment";
import buildNode from "./buildNode";
import buildRun from "./buildRun";
import { nextVarName } from "./buildUtils";

export default function buildComponentNode(
  node: ElementNode,
  status: BuildStatus,
  b: Builder,
  parentName: string,
  anchorName: string,
  root = false,
) {
  b.append("");
  b.append("/* @component */");

  // Props
  const componentHasProps = node.attributes.length || root;
  const propsName = componentHasProps ? nextVarName("props", status) : "undefined";
  if (componentHasProps) {
    // TODO: defaults etc props
    b.append(`const ${propsName} = $watch({});`);
    for (let { name, value } of node.attributes) {
      if (name.startsWith("{") && name.endsWith("}")) {
        name = name.substring(1, name.length - 1);
        buildRun("setProp", `${propsName}["${name}"] = ${name}`, status, b);
      } else {
        let reactive = value.startsWith("{") && value.endsWith("}");
        if (reactive) {
          value = value.substring(1, value.length - 1);
        }
        if (name === "class") {
          // TODO: How to handle dynamic classes etc
          // Probably just compile down to a string?
          value = `"${trimQuotes(value)} tera-${status.styleHash}"`;
        }
        const setProp = `${propsName}["${name}"] = ${value || "true"};`;
        if (reactive) {
          buildRun("setProp", setProp, status, b);
        } else {
          b.append(setProp);
        }
      }
    }
    // PERF: Does this have much of an impact??
    if (root) {
      b.append(`
        if ($props) {
          const propNames = [${status.props.map((p) => `'${p}'`).join(", ")}];
          for (let name of Object.keys($props)) {
            if (!name.startsWith("$") && !propNames.includes(name)) {
              $run(() => ${propsName}[name] = $props[name]);
            }
          }
        }`);
    }
  }

  // Slots
  const componentHasSlots = node.children.length;
  const slotsName = componentHasSlots ? nextVarName("slots", status) : "undefined";
  if (componentHasSlots) {
    b.append(`const ${slotsName} = {};`);
    for (let slot of node.children) {
      if (isSpecialNode(slot)) {
        const nameAttribute = slot.attributes.find((a) => a.name === "name");
        const slotName = nameAttribute ? trimQuotes(nameAttribute.value) : "_";
        b.append(`${slotsName}["${slotName}"] = ($sparent, $sanchor, $sprops) => {`);

        buildFragment(slot, status, b, "$sparent", "$sanchor");

        status.fragmentStack.push({
          fragment: slot.fragment,
          path: "",
        });
        for (let child of slot.children) {
          buildNode(child, status, b, "$sparent", "$sanchor");
        }
        status.fragmentStack.pop();

        addFragment(slot, status, b, "$sparent", "$sanchor");

        b.append(`}`);
      }
    }
  }

  // Build an anchor here, so that effects set in the script can be cleaned up if/when the
  // component is removed
  // And also so that we have an end node for the active range, if needed
  const compParentName = node.parentName!;
  const compAnchorName = node.varName!;
  b.append(`
    ${node.tagName}.render(${compParentName}, ${compAnchorName}, ${propsName}, ${slotsName}, $context)`);
}
