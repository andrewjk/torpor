import type Animation from "./Animation";
import type Cleanup from "./Cleanup";
import type Computed from "./Computed";
import type Effect from "./Effect";
import type ProxySignal from "./ProxySignal";
import type Region from "./Region";

/**
 * The global context for setting up effects and updating subscriptions.
 */
export default interface Context {
	/**
	 * The target (effect or computed value) that is currently being run.
	 */
	activeTarget: Computed | Effect | null;

	/**
	 * To set the next effect, we need to store the previous effect.
	 */
	previousEffect: Effect | null;

	/**
	 * The extent of the current effect's children.
	 */
	extent: number;

	/**
	 * The batch number. If 0, the batch will be flushed at the end of the operation.
	 */
	batch: number;

	/**
	 * Used to check for cycles if the number of operations in a single batch
	 * goes past a threshold.
	 */
	batchOperation: number;

	/**
	 * A function to store a Computed when `$cache` is called in a property getter.
	 */
	registerComputed: ((computed: Computed) => void) | null;

	/**
	 * The first effect to run, either immediately or when the batch is finished.
	 */
	firstEffectToRun: Effect | null;

	/**
	 * The first signal to update, either immediately or when the batch is finished.
	 */
	firstSignalToUpdate: ProxySignal | null;

	/**
	 * The region that is currently being created.
	 */
	activeRegion: Region;

	/**
	 * The region that was previously created, for setting region navigation.
	 */
	previousRegion: Region;

	/**
	 * The root region of the current UI, for debugging.
	 */
	rootRegion: Region;

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
		region: Region;
		el: Element;
		type: string;
		listener: (this: Element, ev: any) => any;
	}[];

	/**
	 * Animations which should be added when their element has been mounted in
	 * the DOM
	 */
	stashedAnimations: {
		region: Region;
		el: HTMLElement;
		in?: Animation;
		out?: Animation;
	}[];

	/** The node that is actively being hydrated. */
	hydrationNode: ChildNode | null;
	////hn: ChildNode | null;
}
