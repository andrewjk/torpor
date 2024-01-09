export default function clearRange(anchor: Node, endNode: Node) {
  const range = document.createRange();
  range.setStartAfter(anchor);
  range.setEndAfter(endNode);
  range.deleteContents();
}
