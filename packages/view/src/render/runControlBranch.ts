import type Region from "../types/Region";
import clearRegion from "./clearRegion";

export default function runControlBranch(region: Region, oldIndex: number, index: number): boolean {
	if (oldIndex === index) return false;

	// HACK: This is bad -- it means that the parent region has been cleared,
	// but that should have cleared the effect that runs this child region??
	// TODO: Look into this further...
	if (region.depth === -2) return false;

	// Branching regions have exactly one child -- remove it if necessary
	if (region.nextRegion !== null && region.nextRegion.depth > region.depth) {
		clearRegion(region.nextRegion);
	}

	return true;
}
