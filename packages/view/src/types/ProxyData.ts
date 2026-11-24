import type Computed from "./Computed";
import type ProxySignal from "./ProxySignal";

// TODO: Rename to DataSource?
export default interface ProxyData {
	target: Record<PropertyKey, any>;
	isArray: boolean;
	// Exotic objects whose prototype methods require internal slots -- they
	// can't be called with a proxy as `this`, so method access is routed
	// through wrapper tables in proxyGet instead
	isDate: boolean;
	isMap: boolean;
	isSet: boolean;
	shallow: boolean;
	signals: Map<PropertyKey, ProxySignal | Computed>;
	/**
	 * True when every object element of this watched array has already been
	 * replaced by its proxy (see `wrapArrayElements` in proxyGet), so read
	 * methods can skip re-scanning the array. Reset whenever a mutation can
	 * insert a raw element (index assignment, push/unshift/splice).
	 */
	elementsWrapped?: boolean;
}
