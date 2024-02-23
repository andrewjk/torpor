import type Range from "../../watch/internal/Range";

export default function moveRange(parent: Node, range: Range, before: Node | null) {
  let el: Node | null = range.startNode;
  while (el) {
    const nextel: Node | null = el.nextSibling;
    parent.insertBefore(el, before);
    if (el === range.endNode) break;
    el = nextel;
  }
}
