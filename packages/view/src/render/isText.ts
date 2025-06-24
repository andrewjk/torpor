export default function isText(node: Node | null | undefined): node is Text {
	return node?.nodeType === 3;
}
