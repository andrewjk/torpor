export default function isFragmentNode(node: Node | null | undefined): node is DocumentFragment {
	return node?.nodeType === 11;
}
