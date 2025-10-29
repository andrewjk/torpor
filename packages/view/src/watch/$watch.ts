import devContext from "../dev/devContext";
import type ProxyData from "../types/ProxyData";
import type WatchOptions from "../types/WatchOptions";
import proxyGet from "./proxyGet";
import proxySet from "./proxySet";
import { proxyDataSymbol } from "./symbols";

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
	if (object === undefined || object === null || object[proxyDataSymbol] !== undefined) {
		return object;
	}

	// DEBUG: Make sure we can proxy this value
	//if (typeof object !== "object") {
	//	throw new Error(`$watch can't be called with a ${typeof object}`);
	//}

	// Create a proxy handler for each object, and store some data for it here
	const data: ProxyData = {
		target: object,
		isArray: Array.isArray(object),
		shallow: options?.shallow === true,
		signals: new Map(),
	};

	// @ts-ignore
	object[proxyDataSymbol] = data;

	const handler: ProxyHandler<T> = {
		get: proxyGet,
		set: proxySet,
	};

	const proxy = new Proxy(object, handler) as T;

	// DEV:
	devContext.onWatch(data);

	return proxy;
}
