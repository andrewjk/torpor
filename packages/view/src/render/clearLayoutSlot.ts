import type Region from "../types/Region";
import clearRegion from "./clearRegion";
import context from "./context";
import { rememberSlotRefillDepth } from "./fillLayoutSlot";

/**
 * Clears a region that was created by `fillLayoutSlot`: tears down the
 * rendered content and its effects, leaving the surrounding layout intact
 * so the slot can be refilled.
 *
 * @param region The region to clear
 */
export default function clearLayoutSlot(region: Region): void {
	context.previousRegion = region.previousRegion!;
	// The refill that replaces this slot runs outside any render, so the depth
	// it must be ranked at can't be derived from `activeRegion`; record the
	// cleared region's depth for `fillLayoutSlot` to reuse
	const parent = region.startNode?.parentNode;
	if (parent) {
		rememberSlotRefillDepth(parent, region.depth);
	}
	clearRegion(region);
}
