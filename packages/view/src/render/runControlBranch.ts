import type Region from "../types/Region";
import clearRegion from "./clearRegion";

export default function runControlBranch(region: Region, oldIndex: number, index: number): boolean {
	// Clear the recreate flag if it was set — it only needs to trigger once
	const recreate = (region as any).recreate;
	if (recreate) {
		(region as any).recreate = false;
	}

	if (oldIndex === index) {
		if (recreate) {
			if (region.nextRegion !== null && region.nextRegion.depth > region.depth) {
				clearRegion(region.nextRegion);
			}
			return true;
		}
		return false;
	}
	if (region.nextRegion !== null && region.nextRegion.depth > region.depth) {
		clearRegion(region.nextRegion);
	}

	return true;
}
