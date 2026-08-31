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
 * Watches an object and runs effects when its properties are changed.
 *
 * Dates, Maps and Sets are supported too: their methods are reactive (reads
 * track, writes notify), so `new Date()`, `new Map()` and `new Set()` can be
 * used in watched state directly.
 *
 * @param object The object to watch
 */
export default function $watch<T extends object>(object: T, options?: WatchOptions): T {
	// Return the object itself if it is undefined or null, or if it is already a proxy
	if (object === undefined || object === null || (object as any)[proxyDataSymbol] !== undefined) {
		return object;
	}

	// Create a proxy handler for each object, and store some data for it here
	const data: ProxyData = {
		target: object as Record<PropertyKey, any>,
		isArray: Array.isArray(object),
		isDate: object instanceof Date,
		isMap: object instanceof Map,
		isSet: object instanceof Set,
		shallow: options?.shallow === true,
		signals: new Map(),
	};

	// Non-enumerable, so spreading or `Object.assign`-ing a watched object
	// (`$state.a = $state.a.map(c => ({ ...c }))`) doesn't copy the marker
	// into the new object — a copied ProxyData points at the OLD target and
	// makes the new object look already-watched, so it never gets deep-wrapped
	Object.defineProperty(object, proxyDataSymbol, {
		value: data,
		writable: true,
		enumerable: false,
		configurable: true,
	});

	const proxy = new Proxy(object, sharedHandler) as T;

	// DEV:
	devContext.onWatch(data);

	return proxy;
}
