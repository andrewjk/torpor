import { proxyDataSymbol } from "./symbols";

/**
 * Returns the target object of a proxy
 *
 * @param object The proxy object
 */
export default function $unwrap<T extends Record<PropertyKey, any>>(object: T): T {
	return object !== undefined && object !== null && object[proxyDataSymbol] !== undefined
		? (object[proxyDataSymbol].target ?? object)
		: object;
}
