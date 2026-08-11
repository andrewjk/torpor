/**
 * Returns a bitmask of the for-loop variables whose substituted paths appear
 * in `expr`. Bit N is set when the Nth for-var (by position in `forVarNames`)
 * is read.
 *
 * After `replaceForVarNames` has run, every reference to a for-var in the
 * body has been rewritten to its data-bag path (e.g. `row` →
 * `t_item_42.data.row`, or `t_item_42.data` for single-var loops). This
 * helper scans the POST-substitution `expr` for those paths and returns a
 * bitmask — used to annotate each effect with `forVarMask` so the keyed-list
 * reconciler's no-proxy force-rerun path (`rerunRegionEffects`) can skip
 * effects that don't depend on the changed for-vars via a single bitwise AND.
 *
 * Conservative by design: a false positive (claiming a dependency that
 * doesn't really exist) just causes an unnecessary re-run, while a false
 * negative would drop a needed update. String literals that happen to
 * contain the substituted path are extremely unlikely and harmless.
 */
export default function forVarsReadIn(expr: string, forVarNames: string[][]): number {
	let mask = 0;
	for (let i = 0; i < forVarNames.length; i++) {
		const subPath = forVarNames[i][1];
		if (subPath && expr.includes(subPath)) {
			mask |= 1 << i;
		}
	}
	return mask;
}
