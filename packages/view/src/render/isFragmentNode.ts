/**
 * Whether the node is a detached template/document fragment — i.e. a tree
 * we're still building, where mount-time side effects (`$onmount`, event
 * hookup, animations) must wait until the outer tree is inserted.
 *
 * A `ShadowRoot` is also `nodeType 11`, but it's a live tree root (its host
 * may already be connected), so side effects must run when content is added
 * to it. `host` distinguishes a shadow root without relying on
 * `instanceof ShadowRoot`, which fails across realms (e.g. an iframe's
 * shadow root).
 */
export default function isFragmentNode(node: Node): node is DocumentFragment {
	return node.nodeType === 11 && (node as any).host === undefined;
}
