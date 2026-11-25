import type Effect from "../../types/Effect";
import type ListItemSpec from "../../types/ListItemSpec";
import type ProxyData from "../../types/ProxyData";
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
	onWatch: (proxy: ProxyData) => void;
	onRun: (effect: Effect) => void;
	onRegionPushed: (region: Region, toParent: boolean, parentName?: string) => void;
	onRegionPopped: () => void;
	onRegionCleared: (region: Region) => void;

	signalSet: (proxy: ProxyData, key: PropertyKey) => void;
	effectRun: (effect: Effect) => void;

	/**
	 * Warns about duplicate `@key` values in a keyed `@for` list. Installed by
	 * `setDevMode`; a no-op in production so the implementation stays in the
	 * dev entry point.
	 */
	checkListKeys: (region: Region, specs: ListItemSpec[]) => void;

	//sendMessage: (message: string) => void;
}
