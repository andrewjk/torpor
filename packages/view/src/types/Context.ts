import type Animation from "./Animation";
import type AwaitBoundary from "./AwaitBoundary";
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
	 * The effects queued to run, either immediately or when the batch is
	 * finished. An array (rather than a linked list) so that an effect can be
	 * re-queued after it has already been processed within the same flush —
	 * dedupe is handled by the `queued` flag on each effect.
	 */
	effectsToRun: Effect[];

	/**
	 * The first signal to update, either immediately or when the batch is finished.
	 */
	firstSignalToUpdate: ProxySignal | null;

	/**
	 * The last signal queued for update, so we can append in O(1).
	 */
	lastSignalToUpdate: ProxySignal | null;

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
	 * The innermost active `@await` boundary's suspend mailbox, or null
	 * when not inside an await boundary. The proxy get trap sets
	 * `.suspended = true` on this when a read hits a `didSuspend` computed;
	 * the boundary effect checks it after rendering content to decide between
	 * the content and `with` branches. Save/restored across nested boundaries.
	 */
	awaitBoundary: AwaitBoundary | null;

	/**
	 * When `true`, `suspendRead` suppresses taint propagation and boundary
	 * notification — it only tracks the signal for subscription and records
	 * that a suspend was encountered in `suspendPeekHit`. Used by `$pending`
	 * to check whether a computation is suspended without itself suspending.
	 */
	suspendPeek: boolean;

	/**
	 * Set by `suspendRead` when a suspended computed is read in peek mode, but
	 * only for *loud* suspends (not bare refreshes — see `Computed.suspendQuiet`
	 * and ASYNC.md §7.4). `$pending` resets this before running its tracking
	 * function and returns it as the result.
	 */
	suspendPeekHit: boolean;

	/**
	 * When non-null, `$refresh` is running its tracking function. Every
	 * `$async` computed read during `fn` is appended here so `$refresh` can
	 * re-run them as bare refreshes (ASYNC.md §7.4 / `$refresh`). `$cache`
	 * computeds are never collected. Reading a computed in this mode does not
	 * recalc, taint, or notify a  boundary — collection is a pure peek.
	 */
	refreshSignals: Computed[] | null;

	/**
	 * When `$refresh` is collecting, the computeds that were *initialized*
	 * by the collection read itself — their getter's first-ever read happened
	 * inside `fn`, so the fetch the caller asked `$refresh` for is already in
	 * flight. `$refresh` skips re-running these; a second run would start a
	 * duplicate fetch whose resolve the generation guard would drop. null
	 * outside collection.
	 */
	refreshInitialized: Set<Computed> | null;

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
