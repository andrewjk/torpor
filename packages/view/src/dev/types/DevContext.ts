import type Region from "../../types/Region";
import type DevBoundary from "./DevBoundary";

export default interface DevContext {
	enabled: boolean;
	depth: number;
	boundaries: DevBoundary[];

	// Hooks
	onRegionPushed: (region: Region, toParent: boolean, parentName?: string) => void;
	onRegionPopped: () => void;
	onRegionCleared: (region: Region) => void;
}
