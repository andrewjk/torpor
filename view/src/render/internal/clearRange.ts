import type Range from "../../watch/internal/Range";
import removeRangeEffects from "../../watch/internal/removeRangeEffects";

export default function clearRange(range: Range) {
  // NOTE: range.deleteContents hangs in JSDOM (or at least in benching/testing with JSDOM),
  // so we need to do our own deleting
  if (!range.startNode) {
    //console.log("not clearing; no start node");
    return;
  }
  range.endNode = range.endNode || range.startNode;
  //console.log("clearing", range.startNode.textContent, "to", range.endNode.textContent, range);

  const parent = range.startNode.parentNode!;
  let currentNode = range.startNode;
  while (currentNode !== range.endNode) {
    let nextNode = currentNode!.nextSibling;
    parent.removeChild(currentNode!);
    currentNode = nextNode!;
  }
  parent.removeChild(currentNode);

  // @ts-ignore
  delete range.startNode;
  // @ts-ignore
  delete range.endNode;

  // TODO: Put this somewhere better?
  removeRangeEffects(range);
}
