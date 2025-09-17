import { type Computed } from "./Computed";
import { type Effect } from "./Effect";
import { type ProxySignal } from "./ProxySignal";

/**
 * A subscription that connects a source Signal or Computed to a target Computed
 * or Effect.
 */
export type Subscription = {
	/**
	 * The source Signal or Computed.
	 */
	source: ProxySignal | Computed;

	/**
	 * The target Computed or Effect.
	 */
	target: Computed | Effect;

	/**
	 * The next source subscription. After the targets have been re-run, we run
	 * through sources to remove any that weren't re-used.
	 */
	nextSource: Subscription | null;

	/**
	 * The next target subscription. When the source is changed, we run through
	 * targets to mark them dirty and possibly re-run them.
	 */
	nextTarget: Subscription | null;

	/**
	 * The previous target subscription. We remove subscriptions by looping
	 * through the sources list, so we only need to know the next source, but we
	 * need to know both the next and previous targets to properly update the
	 * targets list.
	 */
	previousTarget: Subscription | null;

	/**
	 * Whether this subscription is active. At the start of a re-run, all
	 * subscriptions are marked inactive and marked active if re-used. If not
	 * re-used, they are removed after the run.
	 */
	active: boolean;

	/**
	 * Whether the subscription's target may need to be recalculated (if any of
	 * its sources have changed).
	 */
	recalc: boolean;

	/**
	 * The name of the subscription, for debugging.
	 */
	name?: string;
};
