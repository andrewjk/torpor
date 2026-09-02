import type Region from "../types/Region";
import clearRegion from "./clearRegion";
import context from "./context";

/**
 * Clears a region that was created by `fillLayoutSlot`: tears down the
 * rendered content and its effects, leaving the surrounding layout intact
 * so the slot can be refilled.
 *
 * @param region The region to clear
 */
export default function clearLayoutSlot(region: Region): void {
	context.previousRegion = region.previousRegion!;
	clearRegion(region);
}
