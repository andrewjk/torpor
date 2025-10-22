import type DevContext from "./types/DevContext";

const noop = () => {};

const devContext: DevContext = {
	enabled: false,
	depth: 0,
	boundaries: [],

	// Hooks
	onRegionPushed: noop,
	onRegionPopped: noop,
	onRegionCleared: noop,
};

// @ts-ignore
globalThis.T_DEV_CTX = () => {
	// Format devContext for passing to DevTools by stripping out nodes etc
	return devContext;
};

export default devContext;
