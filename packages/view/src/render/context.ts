import type Context from "../types/Context";
import type Region from "../types/Region";

const CONTEXT_SYMBOL: unique symbol = Symbol.for("torp.Context");

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
		activeRegion: null as unknown as Region,
		previousRegion: null as unknown as Region,
		rootRegion: null as unknown as Region,

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
	} satisfies Context);

export default context;
