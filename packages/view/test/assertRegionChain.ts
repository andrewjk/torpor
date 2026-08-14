import type Region from "../src/types/Region";
import context from "../src/render/context";

/**
 * Structural invariant checks for the sibling region chain
 * (`previousRegion`/`nextRegion`), walked from the root region.
 *
 * The keyed-list reconciler and clearRegion/pushRegion rely on this chain
 * being a well-formed flat doubly-linked list in render order, with `depth`
 * marking nesting (a cycle or broken back-pointer hangs the relink walks in
 * runListItems). Call after each state mutation in control-block tests to
 * catch corruption early instead of as an infinite loop.
 *
 * Checks:
 * - the `nextRegion` walk terminates (no cycles)
 * - forward links match back-pointers (`next.previousRegion === current`)
 * - depth descends at most one level between consecutive chain regions
 */
export default function assertRegionChain(): void {
	const root: Region | null = context.rootRegion;
	if (root === null) return;

	const seen = new Set<Region>();
	let current: Region | null = root;
	while (current !== null) {
		if (seen.has(current)) {
			throw new Error(
				`region chain cycle revisiting region '${current.name ?? "(anonymous)"}' (depth ${current.depth})`,
			);
		}
		seen.add(current);

		const next = current.nextRegion;
		if (next !== null) {
			if (next.previousRegion !== current) {
				throw new Error(
					`broken back-pointer: region '${current.name ?? "(anonymous)"}' (depth ${current.depth}) → '${next.name ?? "(anonymous)"}' (depth ${next.depth}) has previousRegion '${next.previousRegion?.name ?? String(next.previousRegion)}'`,
				);
			}
			if (next.depth > current.depth + 1) {
				throw new Error(
					`invalid depth jump: region '${current.name ?? "(anonymous)"}' (depth ${current.depth}) → '${next.name ?? "(anonymous)"}' (depth ${next.depth})`,
				);
			}
		}
		current = next;
	}
}
