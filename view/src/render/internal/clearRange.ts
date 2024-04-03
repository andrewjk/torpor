import type Range from "../../global/Range";
import removeRangeEffects from "../../watch/internal/removeRangeEffects";

export default function clearRange(range: Range) {
  // NOTE: range.deleteContents hangs in JSDOM (or at least in benching/testing with JSDOM),
  // so we need to do our own deleting
  if (range.startNode) {
    range.endNode = range.endNode || range.startNode;

    const parent = range.startNode.parentNode!;
    let currentNode = range.startNode;
    while (currentNode !== range.endNode) {
      let nextNode = currentNode!.nextSibling;
      //console.log("cleared", currentNode);
      parent.removeChild(currentNode!);
      currentNode = nextNode!;
    }
    parent.removeChild(currentNode);
  }

  delete range.startNode;
  delete range.endNode;

  // TODO: Put this somewhere better?
  removeRangeEffects(range);
}
