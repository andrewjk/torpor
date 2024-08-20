import type ControlNode from "../../types/nodes/ControlNode";
import type ElementNode from "../../types/nodes/ElementNode";
import Builder from "../Builder";
import type BuildStatus from "./BuildStatus";

export default function buildAddFragment(
  node: ControlNode | ElementNode,
  status: BuildStatus,
  b: Builder,
  parentName: string,
  anchorName: string,
) {
  if (node.fragment) {
    const fragment = node.fragment;
    const fragmentName = `t_fragment_${fragment.number}`;
    b.append(`t_add_fragment(${fragmentName}, ${parentName}, ${anchorName});`);
    //b.append("console.log('~~~');");
    // TODO: Don't need to do this if the last thing we hydrated was the end node
    if (fragment.endVarName) {
      b.append(`t_next(${fragment.endVarName});`);
    }
    for (let ev of fragment.events) {
      b.append(`${ev.varName}.addEventListener("${ev.eventName}", ${ev.handler});`);
    }
  }
}
