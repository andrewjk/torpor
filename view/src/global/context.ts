import type Cleanup from "./types/Cleanup";
import type Effect from "./types/Effect";
import type Range from "./types/Range";

/**
 * The global context for setting up effects and updating subscriptions.
 */
interface Context {
	/** The effect that is currently being run. */
	activeEffect: Effect | null;

	//activeEffects: Effect[];

	/** The range that is currently being created. */
	activeRange: Range | null;

	/**
	 * Functions that were run via $mount, which should be collected and flushed
	 * when the component is done mounting
	 */
	mountedFunctions: (() => Cleanup | void)[];

	/** The node that is actively being hydrated. */
	hydrationNode: Node | null;
	//hn: Node | null;
}

const context: Context = {
	activeEffect: null,
	activeRange: null,
	mountedFunctions: [],
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
