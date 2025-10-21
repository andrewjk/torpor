import type Region from "../types/Region";
import clearRegion from "./clearRegion";
import context from "./context";

export default function clearLayoutSlot(region: Region): void {
	context.previousRegion = region.previousRegion!;
	clearRegion(region);
}
