export default function isTextNode(node: Node | null | undefined): node is Text {
	return node?.nodeType === 3;
}
