import type Effect from "./Effect";

export default interface ProxyPropState {
	// TODO: Would this be faster than accessing a symbol?
	//isProxy: boolean;
	effects: Effect[] | null;
}
