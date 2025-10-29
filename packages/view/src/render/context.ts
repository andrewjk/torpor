import type Context from "../types/Context";

// TODO: Possibly create this in mount/hydrate so we aren't always checking
// whether it exists with `??=`

const CONTEXT_SYMBOL: unique symbol = Symbol.for("t_context");

const context: Context =
	// @ts-ignore
	(globalThis[CONTEXT_SYMBOL] ??= {
		activeTarget: null,
		previousEffect: null,
		extent: 0,
		batch: 0,
		batchOperation: 0,
		registerComputed: null,

		firstEffectToRun: null,
		firstSignalToUpdate: null,

		// These will definitely be set, in mount or render
		// @ts-ignore
		activeRegion: null,
		// @ts-ignore
		previousRegion: null,
		// @ts-ignore
		rootRegion: null,

		mountEffects: [],
		stashedEvents: [],
		stashedAnimations: [],

		hydrationNode: null,
		//hn: null,
		//get hydrationNode() {
		//	return this.hn;
		//},
		//set hydrationNode(value) {
		//	console.log(`set hydration ${printNode(value)}`);
		//	this.hn = value;
		//},
	});

export default context;
