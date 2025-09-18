export default function isFragmentNode(node: Node): node is DocumentFragment {
	return node.nodeType === 11;
}
