import type ForVar from "../types/ForVar";
import type TemplateNode from "../types/nodes/TemplateNode";
import containsIdentifier from "./containsIdentifier";
import isComponentNode from "./isComponentNode";
import isControlNode from "./isControlNode";
import isElementNode from "./isElementNode";
import isSpecialNode from "./isSpecialNode";

/**
 * Returns the subset of `forVars` that are referenced by code evaluated
 * *synchronously in the enclosing row-create scope*, rather than inside a
 * nested function scope the compiler emits.
 *
 * Every compiler-generated scope (effects, handlers, control callbacks,
 * `$onmount`, `@function` bodies) emits its own shadow binding for the loop
 * vars it reads. The remaining "direct" positions are evaluated in the
 * row-create scope itself and rely on the binding emitted at the top of the
 * row callback:
 *
 * - a component's initial props object (`<Child label={item.name} />`),
 *   including fill/slot content that closes over the row scope,
 * - `@const` / `@console` / `@debugger` statements,
 * - a `&ref` write target, and an interpolated `@element` tag.
 *
 * Emitting the row-scope binding only when one of these needs it avoids an
 * unused `const <var> = <data>;` line in the common case.
 */
export default function forVarsReadDirectlyIn(
	children: TemplateNode[],
	forVars: ForVar[],
): Set<string> {
	const sources: string[] = [];
	collectDirect(children, sources);
	const found = new Set<string>();
	for (const forVar of forVars) {
		// Written vars are substituted, never bound.
		if (!forVar.shadow) continue;
		if (sources.some((source) => containsIdentifier(source, forVar.name))) {
			found.add(forVar.name);
		}
	}
	return found;
}

function collectDirect(nodes: TemplateNode[], out: string[]): void {
	for (const node of nodes) {
		if (isComponentNode(node)) {
			for (const attr of node.attributes) {
				if (attr.value != null) out.push(attr.value);
			}
			// Slots/fills close over the row scope, so their props count too.
			collectDirect(node.children, out);
		} else if (isElementNode(node) || isSpecialNode(node)) {
			// A `<slot>`'s own attributes (`<slot item={item} />`) are built in
			// the enclosing scope, not in the fill callback.
			const slotProps =
				isSpecialNode(node) &&
				(node.tagName === "slot" || node.tagName === "fill" || node.tagName === "filldef");
			for (const attr of node.attributes) {
				if (attr.value == null) continue;
				if (slotProps) {
					out.push(attr.value);
				} else if (attr.name === "&ref") {
					out.push(attr.value);
				} else if (attr.name === "self" && !attr.fullyReactive) {
					// A reactive `self` is emitted inside a `$run` that binds it
					// itself; an interpolated/static one is evaluated inline.
					out.push(attr.value);
				}
			}
			collectDirect(node.children, out);
		} else if (isControlNode(node)) {
			// Other control statements run in their own callback scope, which
			// emits its own bindings.
			if (
				node.operation === "@const" ||
				node.operation === "@console" ||
				node.operation === "@debugger"
			) {
				out.push(node.statement);
			}
		}
		// Text/comment nodes become effects, which bind their own vars.
	}
}
