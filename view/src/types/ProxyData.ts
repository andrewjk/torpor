import type ProxyPropData from "./ProxyPropData";

export default interface ProxyData {
	target: Record<PropertyKey, any>;
	isArray: boolean;
	shallow: boolean;
	propData: Map<PropertyKey, ProxyPropData | null>;
}
