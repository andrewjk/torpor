import type Region from "../types/Region";
import clearRegion from "./clearRegion";
import newRegion from "./newRegion";
import popRegion from "./popRegion";
import pushRegion from "./pushRegion";

export default function runControlBranch(region: Region, create: () => void, name?: string): void {
	// HACK: This is bad -- it means that the parent region has been cleared,
	// but that should have cleared the effect that runs this child region??
	// TODO: Look into this further...
	if (region.depth === -2) return;

	// Branching regions have exactly one child -- remove it if necessary
	if (region.nextRegion !== null && region.nextRegion.depth > region.depth) {
		clearRegion(region.nextRegion);
	}

	const branchRegion = newRegion(name);
	const oldRegion = pushRegion(branchRegion, true);

	// Run the create function
	create();

	popRegion(oldRegion);
}
