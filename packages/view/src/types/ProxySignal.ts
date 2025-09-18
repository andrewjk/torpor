import type Subscription from "./Subscription";
import { SIGNAL_TYPE } from "./constants";

/**
 * A value that causes dependent Computeds and Effects to be re-run. Our signals
 * are implemented as object properties.
 */
export default interface ProxySignal {
	/**
	 * SIGNAL.
	 */
	type: typeof SIGNAL_TYPE;

	/**
	 * The first Computed or Effect that is triggered when this property is changed.
	 */
	firstTarget: Subscription | null;

	/**
	 * When signals have been changed in a batch, this is the next changed signal.
	 */
	nextSignalToUpdate: ProxySignal | null;

	/**
	 * The name of the property, for debugging.
	 */
	name?: string;
}
