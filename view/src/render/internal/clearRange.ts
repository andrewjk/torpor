import context from "../../watch/internal/context";
import removeNodeEffects from "../../watch/internal/removeNodeEffects";

export default function clearRange(anchor: Node, endNode: Node, clearAnchor = false) {
  // HACK: range.deleteContents hangs in JSDOM
  /*
  const range = document.createRange();
  if (clearAnchor) {
    range.setStartBefore(anchor);
  } else {
    range.setStartAfter(anchor);
  }
  range.setEndAfter(endNode);
  range.deleteContents();
  */
  //console.log("clearing", anchor.textContent, "to", endNode.textContent);
  const parent = anchor.parentNode!;
  let currentNode = clearAnchor ? anchor : anchor.nextSibling;
  while (currentNode !== endNode) {
    let nextNode = currentNode!.nextSibling;
    parent.removeChild(currentNode!);
    currentNode = nextNode;
  }
  parent.removeChild(currentNode);

  // TODO: Put this somewhere better?
  if (clearAnchor) {
    removeNodeEffects(anchor);
  } else {
    // HACK:
    const nodeEffects = context.nodeEffects.get(anchor);
    if (nodeEffects) {
      nodeEffects.children.forEach((child, i) => {
        removeNodeEffects(child);
        // @ts-ignore Make sure it's not held onto
        nodeEffects.children[i] = undefined;
      });
    }
  }
}
