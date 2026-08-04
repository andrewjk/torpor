import type TemplateNode from "../types/nodes/TemplateNode";
import hasNestedControl from "./hasNestedControl";

/**
 * Returns true if the body of a `@for` loop contains no nested control
 * statements (`@if`, `@for`, `@await`, `@switch`, `@replace`, `@html`).
 *
 * When true, every effect created by the row template lives directly on the
 * item's own region — never on a descendant region chained off it. The
 * compiler can then emit a "leaf-row" `createListItem` that skips the
 * per-item `pushRegion(item)` / `popRegion(oldRegion)` calls: `runListItems`
 * has already pushed the item onto the active region (via
 * `pushRegion(item, true)`) before calling `create()`, and a leaf body never
 * creates descendant regions, so `context.activeRegion` stays put at the item
 * for the whole callback. Saves two function calls per row plus the
 * `devContext.onRegionPushed` / `onRegionPopped` invocations, which on the
 * 10k-row js-framework-bench `runlots` op is 20000 fewer calls per pass.
 *
 * Note: every no-proxy-safe body is also leaf-safe (`isForBodyNoProxySafe`
 * includes `hasNestedControl`), but the converse is not true — a body that
 * writes to a for-var (disqualifying it from no-proxy) can still be leaf-safe
 * and earn this specialization.
 */
export default function isForBodyLeafSafe(forBodyChildren: TemplateNode[]): boolean {
	return !hasNestedControl(forBodyChildren);
}
