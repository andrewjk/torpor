import devContext from "../dev/devContext";
import type ProxyData from "../types/ProxyData";
import type WatchOptions from "../types/WatchOptions";
import isWrappable from "./isWrappable";
import propagateSignal from "./propagateSignal";
import proxyGet from "./proxyGet";
import proxySet from "./proxySet";
import trackProxySignal from "./trackProxySignal";
import { proxyDataSymbol, proxyKeysSymbol } from "./symbols";

// The Proxy handler is stateless — every trap looks up state via the
// `proxyDataSymbol` property on the target itself — so a single shared
// handler can serve every $watch'd object. Avoiding a fresh `{ get, set }`
// allocation per $watch() call removes N object allocations per N-item list
// render (the per-row `$watch(data, { shallow: true })` in runListItems is
// called once for every keyed list item).
const sharedHandler: ProxyHandler<Record<PropertyKey, any>> = {
	get: proxyGet,
	set: proxySet,
	ownKeys: (target) => {
		// Key enumeration (`Object.keys/values/entries`, spread, `for…in`,
		// `JSON.stringify`) subscribes the reading effect to the key-set
		// membership signal, so adding or deleting a key re-runs it (the
		// mutation side propagates the signal in the `set`/`deleteProperty`
		// traps and the array mutation handles)
		const data = target[proxyDataSymbol];
		if (data !== undefined) {
			trackProxySignal(data, proxyKeysSymbol);
		}
		return Reflect.ownKeys(target);
	},
	has: (target, key) => {
		// `key in obj` depends on the key's *presence*, not its value: adding
		// or deleting any key propagates the key-set membership signal (see
		// `proxySet`/`deleteProperty`), while changing an existing value does
		// not. Without this, an effect doing `"k" in $state` never re-ran when
		// `k` was added.
		const data = target[proxyDataSymbol];
		if (data !== undefined) {
			trackProxySignal(data, proxyKeysSymbol);
		}
		return Reflect.has(target, key);
	},
	deleteProperty: (target, key) => {
		const deleted = Reflect.deleteProperty(target, key);
		const data = target[proxyDataSymbol];
		if (deleted && data !== undefined) {
			propagateSignal(data, key);
			// The key set changed, so effects that enumerated the object
			// (`Object.keys` etc.) must re-run too
			propagateSignal(data, proxyKeysSymbol);
		}
		return deleted;
	},
};

/**
 * Watches an object and runs effects when its properties are changed.
 *
 * Only plain objects, plain arrays, and exact Date/Map/Set instances are
 * deep-watched. Other values -- class instances, subclasses, RegExp, typed
 * arrays, frozen/non-extensible objects, promises, DOM nodes, ... -- are
 * returned unchanged. Effects still track the property that holds them, so
 * replacing the value is reactive even though mutating it in place isn't.
 *
 * Dates, Maps and Sets are supported: their methods are reactive (reads
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

	if (!isWrappable(object)) {
		if (devContext.enabled) {
			console.warn(
				"$watch() only deep-watches plain objects, arrays and exact Date/Map/Set instances; returning this value unchanged.",
			);
		}
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
