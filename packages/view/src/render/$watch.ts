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
	if (object === undefined || object === null || object[proxyDataSymbol] !== undefined) {
		return object;
	}

	// Make sure we can proxy this value
	// TODO: In debug mode maybe?
	//if (typeof object !== "object") {
	//	throw new Error(`$watch can't be called with a ${typeof object}`);
	//}

	// TODO: See if no closures helps
	// Store some data for the proxy in the target object itself
	//const data: ProxyData = {
	//	target: object,
	//	isArray: Array.isArray(object),
	//	shallow: !!options?.shallow,
	//	signals: new Map(),
	//};
	// @ts-ignore
	//object[proxyDataSymbol] = data;

	//const handler: ProxyHandler<T> = {
	//	get: proxyGet,
	//	set: proxySet,
	//};

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

	return new Proxy(object, handler) as T;
}
