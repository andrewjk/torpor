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
}
