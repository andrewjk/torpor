import type ElementNode from "../types/nodes/ElementNode";
import type TemplateNode from "../types/nodes/TemplateNode";
import isControlNode from "./isControlNode";
import isElementNode from "./isElementNode";
import { NON_RENDERING_OPERATIONS } from "./nonRenderingOperations";

/**
 * Returns the single rendering `Element` root child of `children` if the
 * fragment is "single-root element" — i.e. it has exactly one child that
 * renders to the DOM, that child is an `Element`, and every other child is a
 * non-rendering control node (`@key`, `@const`, …) or a comment. Returns
 * `undefined` otherwise.
 *
 * When this returns an `Element`, the compiler emits the
 * `t_fragment_el` / `t_root_el` / `t_add_element` codegen path, which clones
 * the cached template's `firstElementChild` directly into the parent and
 * skips the per-instance `DocumentFragment` allocation that `getFragment`
 * produces.
 *
 * Text-root fragments (`{row.label}` standalone inside a `@for` body) are
 * intentionally excluded: their root is a `Text`, not an `Element`, so
 * `template.content.firstElementChild` would be `null`. Multi-root fragments
 * (`<tr>...</tr><tr>...</tr>`) are excluded because no single element
 * represents the whole fragment.
 */
export default function getSingleElementRoot(
	children: TemplateNode[],
): ElementNode | undefined {
	let renderingRoot: ElementNode | undefined;
	for (const child of children) {
		if (child.type === "comment") continue;
		if (isControlNode(child) && NON_RENDERING_OPERATIONS.has(child.operation)) continue;
		if (renderingRoot) return undefined;
		if (!isElementNode(child)) return undefined;
		renderingRoot = child;
	}
	return renderingRoot;
}
