import type Region from "../types/Region";
import clearRegion from "./clearRegion";

export default function runControlBranch(region: Region, oldIndex: number, index: number): boolean {
	// Clear the recreate flag if it was set — it only needs to trigger once
	const recreate = (region as any).recreate;
	if (recreate) {
		(region as any).recreate = false;
	}

	// Whether this region has rendered a branch before. A region's first
	// render has no previous branch of its own to clear — its `nextRegion`
	// link may point at an unrelated sibling region pushed after it in the
	// region chain, and clearing it would destroy live content mounted
	// elsewhere. (Callers like `runTry` still force clears on later runs by
	// passing a sentinel old index.)
	const firstRender = (region as any).hasRenderedBranch !== true;
	(region as any).hasRenderedBranch = true;

	if (oldIndex === index) {
		if (recreate) {
			if (region.nextRegion !== null && region.nextRegion.depth > region.depth) {
				clearRegion(region.nextRegion);
			}
			return true;
		}
		return false;
	}
	if (!firstRender && region.nextRegion !== null && region.nextRegion.depth > region.depth) {
		clearRegion(region.nextRegion);
	}

	return true;
}
