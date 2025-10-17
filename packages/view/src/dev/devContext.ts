import type DevContext from "./types/DevContext";

const noop = () => {};

const devContext: DevContext = {
	enabled: false,
	boundaries: [],

	// Hooks
	onRangePushed: noop,
	onRangeCleared: noop,
};

// @ts-ignore
globalThis.T_DEV_CTX = () => {
	// Format devContext for passing to DevTools by stripping out nodes etc
	return devContext;
};

export default devContext;
