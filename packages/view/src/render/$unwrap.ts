import { proxyDataSymbol } from "../watch/symbols";

/**
 * Returns the target object of a proxy
 *
 * @param object The proxy object
 */
export default function $unwrap<T extends Record<PropertyKey, any>>(object: T): T {
	return object && object[proxyDataSymbol] ? object[proxyDataSymbol].target || object : object;
}
