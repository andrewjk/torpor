import type ElementNode from "../../types/nodes/ElementNode";

export default function wrangleSpecialNode(node: ElementNode) {
  // HACK: Add a :fill node underneath :slot nodes for their fallback content
  // Anchors will be created for :slot nodes and fragments will be created for the :fill content
  if (node.tagName === ":slot") {
    const fill: ElementNode = {
      type: "special",
      tagName: ":fill",
      attributes: [],
      children: node.children,
    };
    node.children = [fill];
  }
}
