import type Range from "../../global/Range";

export default function moveRange(parent: Node, range: Range, before: Node | null) {
  let el: Node | undefined | null = range.startNode;
  while (el) {
    const nextel: Node | undefined | null = el.nextSibling;
    parent.insertBefore(el, before);
    if (el === range.endNode) break;
    el = nextel;
  }
}
