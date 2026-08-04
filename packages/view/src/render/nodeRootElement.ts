import context from "./context";
import walkHydrationRoot from "./walkHydrationRoot";

/**
 * Gets the root element of a single-root fragment built via `getElementFragment`.
 *
 * Companion to `nodeRoot`, for the codegen path where the compiler has emitted
 * `t_fragment_el` (cloning the cached template's `firstElementChild` directly)
 * instead of `t_fragment` (cloning into a `DocumentFragment`). In the
 * non-hydrating case the cloned element is already the root, so this is a
 * no-op pass-through. In the hydrating case we perform the same cursor walk as
 * `nodeRoot`'s non-text branch so the region's `startNode` lands on the
 * existing DOM node and the hydration cursor advances past any leading
 * whitespace, branch-break markers, and auto-inserted `<tbody>` wrappers.
 *
 * @param node The cloned root element (ignored when hydrating).
 */
export default function nodeRootElement(node: Element): ChildNode {
	if (context.hydrationNode !== null) {
		return walkHydrationRoot();
	}
	return node;
}
