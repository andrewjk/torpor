import type Effect from "../../types/Effect";
import type Region from "../../types/Region";
import type DevBoundary from "./DevBoundary";

export default interface DevContext {
	enabled: boolean;
	depth: number;
	index: number;
	boundaries: DevBoundary[];

	format: () => any;
	getDetails: (id: string) => string;
	unmark: () => void;
	mark: (id: string) => void;

	// Hooks
	onRegionPushed: (region: Region, toParent: boolean, parentName?: string) => void;
	onRegionPopped: () => void;
	onRegionCleared: (region: Region) => void;

	effectRun: (effect: Effect) => void;

	//sendMessage: (message: string) => void;
}
