import devContext from "../dev/devContext";
import type Region from "../types/Region";
import context from "./context";

export default function popRegion(oldRegion: Region): void {
	context.activeRegion = oldRegion;

	devContext.onRegionPopped();
}
