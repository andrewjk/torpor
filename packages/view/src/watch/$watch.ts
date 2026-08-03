import devContext from "../dev/devContext";
import type ProxyData from "../types/ProxyData";
import type WatchOptions from "../types/WatchOptions";
import proxyGet from "./proxyGet";
import proxySet from "./proxySet";
import { proxyDataSymbol } from "./symbols";

// The Proxy handler is stateless — every trap looks up state via the
// `proxyDataSymbol` property on the target itself — so a single shared
// handler can serve every $watch'd object. Avoiding a fresh `{ get, set }`
// allocation per $watch() call removes N object allocations per N-item list
// render (the per-row `$watch(data, { shallow: true })` in runListItems is
// called once for every keyed list item).
const sharedHandler: ProxyHandler<Record<PropertyKey, any>> = {
	get: proxyGet,
	set: proxySet,
};

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

	const proxy = new Proxy(object, sharedHandler) as T;

	// DEV:
	devContext.onWatch(data);

	return proxy;
}
