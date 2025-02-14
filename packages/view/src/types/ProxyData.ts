import { type ProxyPropData } from "./ProxyPropData";

export type ProxyData = {
	target: Record<PropertyKey, any>;
	isArray: boolean;
	shallow: boolean;
	propData: Map<PropertyKey, ProxyPropData | null>;
};
