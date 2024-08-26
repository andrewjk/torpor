import arrayHandler from "./internal/arrayHandler";
import handler from "./internal/handler";
import { isProxySymbol } from "./internal/symbols";

// TODO: Take an options object with e.g. shallow etc

/**
 * Watches an object for changes to its properties
 * @param object The object to watch
 */
export default function $watch<T extends Record<string | symbol, any>>(object: T): T {
	// Return the object itself if it is undefined or null, or if it is already a proxy
	if (object == null || object[isProxySymbol]) {
		return object;
	}

	if (typeof object !== "object") {
		throw new Error(`$watch can't be called with a " + ${typeof object}`);
	}

	// Otherwise, wrap the object in a Proxy with a plain object or array handler
	const proxyHandler = Array.isArray(object) ? arrayHandler : handler;
	return new Proxy(object, proxyHandler) as T;
}
