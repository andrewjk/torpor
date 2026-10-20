/**
 * The identity of a `source: "server"` getter read: the watched object and the
 * property key being read. The server await state records reads by identity
 * (rather than position) so the render pass can read a getter a different
 * number of times than the collect pass did — e.g. when markup branches on the
 * resolved value.
 */
export interface ServerReadSite {
	owner: object | null;
	key: PropertyKey | string;
}

let currentSite: ServerReadSite | null = null;

/** The watched getter currently being read, or null outside a `$watch` get. */
export function currentServerReadSite(): ServerReadSite | null {
	return currentSite;
}

/**
 * Server-render counterpart of `$watch`.
 *
 * State doesn't need to be reactive on the server, so values aren't wrapped
 * for tracking. Plain objects and arrays are wrapped in a lightweight proxy
 * that only records the property key while an accessor getter runs:
 * `$serverAsync` uses that to identify the getter site across the collect and
 * render passes. Other objects (Maps, class instances, …) are returned
 * untouched — proxying them would break internal slots or private fields, and
 * they rarely carry async getters.
 */
export default function $serverWatch<T extends Record<PropertyKey, any>>(object: T): T {
	if (object === null || object === undefined) {
		return object;
	}
	const prototype = Object.getPrototypeOf(object);
	if (!Array.isArray(object) && prototype !== Object.prototype && prototype !== null) {
		return object;
	}

	return new Proxy(object, {
		get(target, key, receiver) {
			const descriptor = Object.getOwnPropertyDescriptor(target, key);
			if (descriptor?.get === undefined) {
				return Reflect.get(target, key, receiver);
			}
			const previous = currentSite;
			currentSite = { owner: target, key };
			try {
				return Reflect.get(target, key, receiver);
			} finally {
				currentSite = previous;
			}
		},
	});
}
