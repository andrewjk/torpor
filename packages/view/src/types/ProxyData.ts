import type Computed from "./Computed";
import type ProxySignal from "./ProxySignal";

// TODO: Rename to DataSource?
export default interface ProxyData {
	target: Record<PropertyKey, any>;
	isArray: boolean;
	shallow: boolean;
	signals: Map<PropertyKey, ProxySignal | Computed | null>;
}
