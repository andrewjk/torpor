import type DevContext from "./types/DevContext";

const DEV_CONTEXT_SYMBOL: unique symbol = Symbol.for("t_dev_context");

const noop = () => {};

const devContext: DevContext =
	// @ts-ignore
	(globalThis[DEV_CONTEXT_SYMBOL] ??= {
		enabled: false,
		depth: 0,
		index: -1,
		boundaries: [],

		format: () => "",
		getDetails: () => "",
		unmark: noop,
		mark: noop,

		// Hooks
		onWatch: noop,
		onRun: noop,
		onRegionPushed: noop,
		onRegionPopped: noop,
		onRegionCleared: noop,

		signalSet: noop,
		effectRun: noop,
	} satisfies DevContext);

export default devContext;
