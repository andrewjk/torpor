import { type Context } from "../types/Context";

const context: Context = {
	activeTarget: null,
	previousEffect: null,
	extent: 0,
	batch: 0,
	batchOperation: 0,
	registerComputed: null,

	firstEffectToRun: null,
	firstSignalToUpdate: null,

	activeRange: null,
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
};

export default context;
