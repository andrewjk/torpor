import context from "./context";
import nodeCheckHydrationBreak from "./nodeCheckHydrationBreak";
import nodeNext from "./nodeNext";

/**
 * Gets the sibling of a node, x nodes after it.
 *
 * When hydrating, sets the hydration node. `textMask` marks steps that
 * should land on a text node (bit i = the i-th step, counting from
 * `node`): such a step reuses the current node when it is already text
 * (text nodes get merged in HTML) and does not skip whitespace-only text
 * nodes — matching `nodeNext(node, true)`. Steps without their bit set
 * match `nodeNext(node, false)`.
 *
 * @param node The node.
 * @param count The number of nodes to skip.
 * @param textMask Bitmask of text steps.
 */
export default function nodeSkip(node: ChildNode, count: number, textMask = 0): ChildNode {
	let nextNode = node;

	// NOTE: We know these are not null as it is being called from generated code
	if (context.hydrationNode !== null) {
		if (textMask === 0) {
			for (let i = 0; i < count; i++) {
				nextNode = nodeCheckHydrationBreak(nextNode.nextSibling)!;
			}
		} else {
			for (let i = 0; i < count; i++) {
				nextNode = nodeNext(nextNode, (textMask & (1 << i)) !== 0)!;
			}
		}
	} else {
		for (let i = 0; i < count; i++) {
			nextNode = nextNode.nextSibling!;
		}
	}

	return nextNode;
}
