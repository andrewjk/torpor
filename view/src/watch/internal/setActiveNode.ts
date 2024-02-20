import context from "./context";

export default function setActiveNode(node: Node) {
  if (context.activeNode) {
    const nodeEffects = context.nodeEffects.get(context.activeNode);
    if (nodeEffects) {
      nodeEffects.children.push(node);
    }
  }
  context.activeNode = node;
}
