export default function isComment(node: Node): node is Comment {
  return node.nodeType === 8;
}
