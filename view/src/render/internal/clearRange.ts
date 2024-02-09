export default function clearRange(anchor: Node, endNode: Node, clearAnchor = false) {
  const range = document.createRange();
  if (clearAnchor) {
    range.setStartBefore(anchor);
  } else {
    range.setStartAfter(anchor);
  }
  range.setEndAfter(endNode);
  range.deleteContents();
}
