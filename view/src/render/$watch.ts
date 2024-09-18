import type ProxyData from "../types/ProxyData";
import type WatchOptions from "../types/WatchOptions";
import proxyGet from "../watch/proxyGet";
import proxySet from "../watch/proxySet";
import { proxyDataSymbol } from "../watch/symbols";

/**
 * Watches an object and runs effects when its properties are changed
 *
 * @param object The object to watch
 */
export default function $watch<T extends Record<PropertyKey, any>>(
	object: T,
	options?: WatchOptions,
): T {
	// Return the object itself if it is undefined or null, or if it is already a proxy
	if (object == null || object[proxyDataSymbol]) {
		return object;
	}

	// Make sure we can proxy this value
	// TODO: In debug mode maybe?
	//if (typeof object !== "object") {
	//	throw new Error(`$watch can't be called with a ${typeof object}`);
	//}

	// Create a proxy handler for each object, and store some data for it here
	const data: ProxyData = {
		target: object,
		isArray: Array.isArray(object),
		shallow: !!options?.shallow,
		propData: new Map(),
	};
	const handler: ProxyHandler<T> = {
		get: function (target, prop, receiver) {
			return proxyGet(target, prop, receiver, data);
		},
		set: function (target, prop, value, receiver) {
			return proxySet(target, prop, value, receiver, data);
		},
	};

	return new Proxy(object, handler) as T;
}
