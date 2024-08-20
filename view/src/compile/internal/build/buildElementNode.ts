import type ElementNode from "../../types/nodes/ElementNode";
import { trimMatched, trimQuotes } from "../utils";
import BuildStatus from "./BuildStatus";
import Builder from "./Builder";
import buildNode from "./buildNode";
import buildRun from "./buildRun";

export default function buildElementNode(
  node: ElementNode,
  status: BuildStatus,
  b: Builder,
  parentName: string,
  anchorName: string,
  root = false,
) {
  const varName = node.varName;
  if (varName) {
    // PERF: Does this have much of an impact??
    if (root) {
      // TODO: I think we know what the props are at this stage, so we could be more direct?
      b.append("");
      b.append(
        `t_apply_props(${varName}, $props, [${status.props.map((p) => `'${p}'`).join(", ")}]);`,
      );
    }
    buildElementAttributes(node, varName, status, b);
  }

  for (let child of node.children) {
    buildNode(child, status, b, parentName, "null");
  }
}

function buildElementAttributes(
  node: ElementNode,
  varName: string,
  status: BuildStatus,
  b: Builder,
) {
  for (let { name, value } of node.attributes) {
    if (name.startsWith("{") && name.endsWith("}")) {
      name = name.substring(1, name.length - 1);
      buildRun("setAttribute", `${varName}.setAttribute("${name}", ${name});`, status, b);
    } else if (name.startsWith("on")) {
      value = trimMatched(value, "{", "}");

      // Add an event listener
      const eventName = name.substring(2);

      const fragment = status.fragmentStack[status.fragmentStack.length - 1].fragment;
      if (fragment) {
        fragment.events.push({ varName, eventName, handler: value });
      }
    } else if (value.startsWith("{") && value.endsWith("}")) {
      value = value.substring(1, value.length - 1);

      if (name.indexOf("bind:") === 0) {
        // TODO: Don't love the bind: syntax -- $value? @value? :value?
        // Automatically add an event to bind the value
        // TODO: need to check the element to find out what type of event to add
        let eventName = "input";
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
        const setAttribute = `${varName}.setAttribute("${propName}", ${set})`;
        buildRun("setBinding", `${setAttribute};`, status, b);
        // TODO: Add a parseInput method that handles NaN etc
        b.append(`${varName}.addEventListener("${eventName}", (e) => ${value} = ${inputValue});`);
      } else if (name.indexOf("class:") === 0) {
        const propName = name.substring(6);
        const setAttribute = `${varName}.classList.toggle("${propName}", ${value})`;
        buildRun("setClassList", `${setAttribute};`, status, b);
      } else if (name === "class") {
        buildRun("setClassName", `${varName}.className = ${value};`, status, b);
      } else if (name.indexOf("data-") === 0) {
        // dataset seems to be a tiny bit slower?
        //const propName = name.substring(5);
        //buildRun("setDataAttribute", `${varName}.dataset.${propName} = ${value};`, status, b);
        buildRun("setDataAttribute", `${varName}.setAttribute("${name}", ${value});`, status, b);
      } else {
        buildRun("setAttribute", `${varName}.setAttribute("${name}", ${value});`, status, b);
      }
    }
  }
}
