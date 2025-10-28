import type DevContext from "./types/DevContext";

const noop = () => {};

const devContext: DevContext = {
	enabled: false,
	depth: 0,
	index: -1,
	boundaries: [],

	format: () => "",
	getDetails: () => "",
	unmark: noop,
	mark: noop,

	// Hooks
	onRegionPushed: noop,
	onRegionPopped: noop,
	onRegionCleared: noop,

	effectRun: noop,
};

// Add to globalThis for getting from the extension
// @ts-ignore
globalThis.T_DEV_CONTEXT = devContext;

export default devContext;
