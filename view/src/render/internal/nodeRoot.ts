import printNode from "../../debug/printNode";
import context from "../../global/context";

/**
 * Gets the first child in a fragment
 * */
export default function nodeRoot(parent: ParentNode) {
  if (context.hydrationNode) {
    //console.log(`leave hydration ${printNode(context.hydrationNode)}`);

    // If hydrating, set the active range's start node, as it won't have been done in
    // getFragment
    if (context.activeRange) {
      context.activeRange.startNode = context.hydrationNode as ChildNode;
      //console.log("set start node", printNode(context.activeRange.startNode));
    }

    return context.hydrationNode;
  } else {
    // TODO: I don't think we need this
    // If we're mounting rather than hydrating, set the active range's start node
    // to the first node in the fragment
    if (context.activeRange) {
      context.activeRange.startNode = parent.firstChild;
    }
    return parent.firstChild;
  }
}
