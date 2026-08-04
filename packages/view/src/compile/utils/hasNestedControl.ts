import type ElementNode from "../types/nodes/ElementNode";
import type TemplateNode from "../types/nodes/TemplateNode";
import isControlNode from "./isControlNode";
import { NON_RENDERING_OPERATIONS } from "./nonRenderingOperations";

/**
 * Returns true if any descendant of a `@for` body is a control node that
 * creates its own region and effects (`@if`, `@for`, `@await`, `@switch`,
 * `@replace`, `@html`).
 *
 * Operations that produce no DOM and no region (`@key`, `@const`, `@console`,
 * `@debugger`, `@function`) are fine — same category as `@key`. They are
 * descended through, so a real control statement nested under a `@key` (a
 * common shape — `@for` bodies almost always lead with `@key = ...`) is still
 * detected.
 *
 * Extracted from `isForBodyNoProxySafe` so the no-proxy specialization, the
 * leaf-row region-chain specialization (`isForBodyLeafSafe`), and any future
 * pass that needs the same structural predicate can share one source of
 * truth.
 */
export default function hasNestedControl(children: TemplateNode[]): boolean {
	for (const child of children) {
		if (isControlNode(child)) {
			if (!NON_RENDERING_OPERATIONS.has(child.operation)) {
				return true;
			}
			// A non-rendering control node (e.g. `@key`) wraps the actual
			// body content; keep descending so we still detect a real
			// control statement nested under it.
			if (hasNestedControl(child.children)) return true;
			continue;
		}
		if (isElementLike(child)) {
			if (hasNestedControl(child.children)) return true;
		}
	}
	return false;
}

function isElementLike(node: TemplateNode): node is ElementNode {
	return node.type === "element" || node.type === "component" || node.type === "special";
}
