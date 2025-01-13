import type Cleanup from "./Cleanup";
import type ProxyPropData from "./ProxyPropData";

/**
 * An effect that is run and re-run when the properties it depends on change.
 */
export default interface Effect {
	run: () => Cleanup | void;
	cleanup: Cleanup | null;

	/**
	 * Store the properties that this effect depends on, so that when a range is
	 * cleared, the effect can be removed from those properties
	 */
	props: ProxyPropData[] | null;

	active: boolean;
}
