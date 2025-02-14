import { type Animation } from "../types/Animation";
import { type Cleanup } from "../types/Cleanup";
import { type Effect } from "../types/Effect";
import { type Range } from "../types/Range";

/**
 * The global context for setting up effects and updating subscriptions.
 */
interface Context {
	/** The effect that is currently being run. */
	activeEffect: Effect | null;

	/** The range that is currently being created. */
	activeRange: Range | null;

	/**
	 * Functions that were run via $mount, which should be collected and flushed
	 * when the component has been mounted in the DOM
	 */
	mountEffects: (() => Cleanup | void)[];

	/**
	 * Events which should be added when their element has been mounted in the
	 * DOM
	 */
	stashedEvents: {
		range: Range | null;
		el: Element;
		type: string;
		listener: (this: Element, ev: any) => any;
	}[];

	/**
	 * Animations which should be added when their element has been mounted in
	 * the DOM
	 */
	stashedAnimations: {
		range: Range | null;
		el: HTMLElement;
		in?: Animation;
		out?: Animation;
	}[];

	/** The node that is actively being hydrated. */
	hydrationNode: ChildNode | null;
	//hn: ChildNode | null;
}

const context: Context = {
	activeEffect: null,
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
