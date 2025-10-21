import type Region from "../../types/Region";

export default interface DevContext {
	enabled: boolean;
	boundaries: string[];

	// Hooks
	onRegionPushed: (_: Region) => void;
	onRegionCleared: (_: Region) => void;
}
