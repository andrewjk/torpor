import type ElementNode from "../../types/nodes/ElementNode";
import type BuildStatus from "./BuildStatus";
import Builder from "./Builder";
import buildSlotNode from "./buildSlotNode";

export default function buildSpecialNode(
  node: ElementNode,
  status: BuildStatus,
  b: Builder,
  parentName: string,
  anchorName: string,
) {
  switch (node.tagName) {
    case ":slot": {
      buildSlotNode(node, status, b, parentName, anchorName);
    }
  }
  return "";
}
