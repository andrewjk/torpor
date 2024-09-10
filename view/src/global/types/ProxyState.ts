import type ProxyPropState from "./ProxyPropState";

export default interface ProxyState {
	target: Record<PropertyKey, any>;
	isArray: boolean;
	props: Map<PropertyKey, ProxyPropState | null>;
}
