import type ForVar from "../types/ForVar";
import containsIdentifier from "./containsIdentifier";

/**
 * Returns a bitmask of the for-loop variables whose names appear in `expr`.
 * Bit N is set when the Nth for-var (by position in `forVars`) is read.
 *
 * Used to annotate each effect with `forVarMask` so the keyed-list
 * reconciler's no-proxy force-rerun path (`rerunRegionEffects`) can skip
 * effects that don't depend on the changed for-vars via a single bitwise AND.
 *
 * Read-only loop vars are referenced by their bare name (they resolve to a
 * per-scope shadow binding); written vars are substituted to their data path,
 * whose trailing property is the variable name. Matching on an
 * identifier-boundary regex catches both (`t_item.data.row` contains a
 * standalone `row`), without matching substrings of the compiler's generated
 * names (e.g. the `i` inside `t_item_1`).
 *
 * Conservative by design: a false positive (claiming a dependency that
 * doesn't really exist) just causes an unnecessary re-run, while a false
 * negative would drop a needed update.
 */
export default function forVarsReadIn(expr: string, forVars: ForVar[]): number {
	let mask = 0;
	for (let i = 0; i < forVars.length; i++) {
		if (containsIdentifier(expr, forVars[i].name)) {
			mask |= 1 << i;
		}
	}
	return mask;
}
