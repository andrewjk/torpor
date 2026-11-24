import $watch from "./$watch";
import isWrappable from "./isWrappable";
import { proxyDataSymbol } from "./symbols";

/**
 * Wraps a value with `$watch` if it is a plain object, plain array, or exact
 * Date/Map/Set instance that is not already watched. Returns the value
 * unchanged otherwise (class instances, subclasses, RegExp, typed arrays,
 * frozen objects, promises, DOM nodes, ... stay opaque).
 *
 * Used by the `get` trap (wrap values on read) and the `set` trap (wrap
 * values on write), so a value stored in watched state is reactive whether
 * it's been read yet or not.
 */
const proxyCache = new WeakMap<object, object>();

// Proxies this module created, so bulk callers (e.g. wrapping array elements)
// can tell "already wrapped" without reading `proxyDataSymbol` through the
// proxy's `get` trap — a WeakSet hit is much cheaper.
const wrappedProxies = new WeakSet<object>();

/**
 * Whether `value` is a proxy created by `deepWrap` — checked without going
 * through the proxy's `get` trap.
 */
export function isWrappedProxy(value: any): boolean {
	return value !== null && typeof value === "object" && wrappedProxies.has(value);
}

export default function deepWrap(value: any): any {
	if (value === undefined || value === null || typeof value !== "object") {
		return value;
	}
	if (wrappedProxies.has(value)) {
		// A proxy we created — already wrapped
		return value;
	}
	if (value[proxyDataSymbol] !== undefined) {
		// Already watched -- it's either a proxy itself, or a raw target whose
		// proxy wasn't cached (e.g. it was wrapped directly via `$watch` and
		// never deep-wrapped). Short-circuit BEFORE reading `then`, otherwise
		// the read goes through the proxy's `get` trap and creates a spurious
		// signal for a property nothing ever sets
		return proxyCache.get(value) ?? value;
	}
	// Class instances, RegExp, typed arrays, frozen/non-extensible objects,
	// DOM nodes and other exotic objects can't be proxied transparently (or
	// would throw when the metadata is added), so they stay opaque. Effects
	// still track the key they're stored under, so replacing the value is
	// reactive even though mutating it in place isn't.
	if (!isWrappable(value)) {
		return value;
	}
	// Plain thenables are treated like promises
	if (value.then !== undefined) {
		return value;
	}
	const cached = proxyCache.get(value);
	if (cached !== undefined) {
		return cached;
	}
	const proxy = $watch(value);
	proxyCache.set(value, proxy);
	wrappedProxies.add(proxy);
	return proxy;
}
