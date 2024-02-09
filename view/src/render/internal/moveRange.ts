export default function moveRange(parent: Node, anchor: Node, endNode: Node, before: Node | null) {
  let el: Node | null = anchor;
  while (el) {
    const nextel: Node | null = el.nextSibling;
    parent.insertBefore(el, before);
    if (el === endNode) break;
    el = nextel;
  }
}
