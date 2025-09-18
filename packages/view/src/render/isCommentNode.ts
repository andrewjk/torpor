export default function isCommentNode(node: Node): node is Comment {
	return node.nodeType === 8;
}
