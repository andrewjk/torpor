export default function isCommentNode(node: Node | null | undefined): node is Comment {
	return node?.nodeType === 8;
}
