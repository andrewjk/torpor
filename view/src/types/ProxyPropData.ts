import { type Effect } from "./Effect";

/**
 * State data for a property in a proxy.
 */
export type ProxyPropData = {
	/**
	 * The effects that are triggered when this property is changed.
	 */
	effects: Effect[] | null;
};
