/**
 * During hydration, `nodeAnchor` finds the first node inside a hydration
 * block and removes the start/end marker comments. Generated code for
 * `@html` needs that first node later (to adopt the server-rendered nodes
 * as the region's bounds), but by then the markers are gone — so the only
 * reliable way to recover it is to stash it here, keyed by the anchor node
 * that `nodeAnchor` returns.
 */
const firstInsideNodes = new WeakMap<ChildNode, ChildNode | null>();

export function setFirstInsideNode(anchor: ChildNode, node: ChildNode | null): void {
	firstInsideNodes.set(anchor, node);
}

/**
 * Gets the first node that was inside the hydration block for the given
 * anchor node, or `undefined` if the anchor wasn't hydrated through
 * hydration markers.
 */
export default function firstInsideNode(anchor: ChildNode): ChildNode | null | undefined {
	return firstInsideNodes.get(anchor);
}
