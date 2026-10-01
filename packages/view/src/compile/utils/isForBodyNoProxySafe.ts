import type TemplateNode from "../types/nodes/TemplateNode";
import forVarsWrittenIn from "./forVarsWrittenIn";
import hasNestedControl from "./hasNestedControl";

/**
 * Returns true if the body of a `@for` loop never writes to any of its loop
 * variables (`forVars`) — neither directly (`row = ...`, `row.x = ...`,
 * `row[k] = ...`) nor via compound assignment (`+=`, `++`, etc.) — AND the
 * body contains no nested control statements (`@if`, `@for`, `@await`, …).
 *
 * When both hold, the compiler can emit a "no-proxy" `@for` specialization
 * that skips the per-item shallow `$watch` Proxy around the loop variable
 * bag: reads of `data.<forVar>` are plain property accesses (no proxyGet
 * trap), and the compiler-emitted `updateListItem` callback re-runs item
 * effects manually (via `t_rerun_region_effects`) when a forVar's reference
 * actually changes.
 *
 * The "no nested controls" constraint keeps the manual effect re-run sound:
 * without it, a nested `@if`'s effects would live on a descendant region
 * chained off the original item, but after keyed reconciliation that chain
 * is orphaned (the live item is a different object), so the re-run walk
 * couldn't find them. With no nested controls every row effect is on the
 * item itself, which is exactly what `t_rerun_region_effects` walks.
 *
 * Detection is intentionally conservative: a regex scan over every
 * expression-like string in the body (text interpolation, attribute values,
 * event handlers, control statements). Anything ambiguous falls back to the
 * proxy path. The for-statement itself (`for (let row of ...)`) is NOT
 * scanned — that's the loop header, not the body — so `for (...; i++)` style
 * loops with `i++` in the header are still eligible.
 */
export default function isForBodyNoProxySafe(
	forBodyChildren: TemplateNode[],
	forVars: string[],
): boolean {
	if (forVars.length === 0) return false;
	if (hasNestedControl(forBodyChildren)) return false;
	return forVarsWrittenIn(forBodyChildren, forVars).size === 0;
}
