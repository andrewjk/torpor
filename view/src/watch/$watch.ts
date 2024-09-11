import type ProxyState from "../global/types/ProxyState";
import proxyGet from "./internal/proxyGet";
import proxySet from "./internal/proxySet";
import { proxyStateSymbol } from "./internal/symbols";
import type WatchOptions from "./types/WatchOptions";

/**
 * Watches an object and runs effects when its properties are changed
 * @param object The object to watch
 */
export default function $watch<T extends Record<PropertyKey, any>>(
	object: T,
	options?: WatchOptions,
): T {
	// Return the object itself if it is undefined or null, or if it is already a proxy
	if (object == null || object[proxyStateSymbol]) {
		return object;
	}

	// Make sure we can proxy this value
	// TODO: In debug mode maybe?
	//if (typeof object !== "object") {
	//	throw new Error(`$watch can't be called with a ${typeof object}`);
	//}

	// Create a proxy handler for each object, and store some state for it here
	const state: ProxyState = {
		target: object,
		isArray: Array.isArray(object),
		shallow: !!options?.shallow,
		props: new Map(),
	};
	const handler: ProxyHandler<T> = {
		get: function (target, prop, receiver) {
			return proxyGet(target, prop, receiver, state);
		},
		set: function (target, prop, value, receiver) {
			return proxySet(target, prop, value, receiver, state);
		},
	};

	return new Proxy(object, handler) as T;
}
