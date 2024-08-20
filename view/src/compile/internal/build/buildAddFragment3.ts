//import type ControlNode from "../../types/nodes/ControlNode";
//import type ElementNode from "../../types/nodes/ElementNode";
//import type BuildStatus from "./BuildStatus";
//import Builder from "./Builder";
//
//export default function buildAddFragment(
//  node: ControlNode | ElementNode,
//  status: BuildStatus,
//  b: Builder,
//  parentName: string,
//  anchorName: string,
//) {
//  if (node.fragment) {
//    const fragment = node.fragment;
//    const fragmentName = `t_fragment_${fragment.number}`;
//    // TODO: Don't need to do this if the last thing we hydrated was the end node
//    b.append(`t_goto(${fragment.endVarName});`);
//    b.append(`t_add_fragment(${fragmentName}, ${parentName}, ${anchorName});`);
//    for (let ev of fragment.events) {
//      b.append(`${ev.varName}.addEventListener("${ev.eventName}", ${ev.handler});`);
//    }
//  }
//}
