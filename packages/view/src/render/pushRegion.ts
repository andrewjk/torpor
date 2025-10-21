import { devContext } from "../dev";
import type Region from "../types/Region";
import context from "./context";

export default function pushRegion(region: Region, toParent = false): Region {
	const activeRegion = context.activeRegion;

	// Add the new region to the currently active region's children, so that we
	// can delete the children with the parent
	if (toParent) {
		const previousRegion = context.previousRegion;
		region.previousRegion = previousRegion;

		const nextRegion = previousRegion.nextRegion;
		previousRegion.nextRegion = region;
		region.nextRegion = nextRegion;

		region.depth = activeRegion.depth + 1;
	}

	// Set the new active region
	context.activeRegion = region;
	context.previousRegion = region;

	// DEV:
	devContext.onRegionPushed(region);

	// Return the old active region, so that it can be reset when done
	return activeRegion;
}
