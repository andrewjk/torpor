import type ElementNode from "../../types/nodes/ElementNode";
import Builder from "../Builder";
import type BuildServerStatus from "./BuildServerStatus";
import buildServerSlotNode from "./buildServerSlotNode";

export default function buildServerSpecialNode(
  node: ElementNode,
  status: BuildServerStatus,
  b: Builder,
) {
  switch (node.tagName) {
    case ":slot": {
      buildServerSlotNode(node, status, b);
    }
  }
}
