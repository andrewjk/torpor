export default function isComment(node: Node | null | undefined): node is Comment {
	return node?.nodeType === 8;
}
