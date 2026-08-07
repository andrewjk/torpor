import type ElementNode from "../types/nodes/ElementNode";
import type RootNode from "../types/nodes/RootNode";
import type TemplateNode from "../types/nodes/TemplateNode";

/**
 * Returns true if `markup` renders anything that forwards the component's
 * `$context` parameter: a child component invocation (`<Child />`), a
 * self-recursive `<@component self>`, or a `<slot>` definition (whose
 * generated render call passes `$context` through to the filling parent).
 *
 * `contextProps` only captures *direct* `$context.x` reads in the script, so
 * this is needed to decide whether the `$context` parameter is actually used:
 * every child-component / slot render call passes `$context` positionally
 * (see buildComponentNode / buildSlotNode and their server counterparts),
 * even when the component never names `$context` explicitly.
 *
 * Bias is towards `true`: when uncertain we keep `$context` named, which is
 * always safe at the cost of a missed unused-parameter cleanup.
 */
export default function markupRendersComponent(markup: RootNode): boolean {
	return nodeRendersComponent(markup);
}

function nodeRendersComponent(node: TemplateNode): boolean {
	if (node.type === "component") return true;
	if (node.type === "special") {
		const tagName = (node as ElementNode).tagName;
		if (tagName === "@component" || tagName === "slot") return true;
	}
	const children = (node as { children?: TemplateNode[] }).children;
	if (children) {
		for (const child of children) {
			if (nodeRendersComponent(child)) return true;
		}
	}
	return false;
}
