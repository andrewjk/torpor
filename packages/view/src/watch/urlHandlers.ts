import type ProxyData from "../types/ProxyData";
import batchEnd from "./batchEnd";
import batchStart from "./batchStart";
import propagateSignal from "./propagateSignal";
import { proxyDataSymbol } from "./symbols";
import trackProxySignal from "./trackProxySignal";

// URLs are small and almost every mutation changes the href, so all URL
// property/method reads share one signal. URLSearchParams is linked to its
// URL (when accessed through `url.searchParams`), and mutations notify both
// the params readers and the URL readers.
export const URL_KEY: unique symbol = Symbol("torp.url");
export const URL_PARAMS_KEY: unique symbol = Symbol("torp.urlParams");

export const URL_PROPERTIES: Set<string> = new Set([
	"href",
	"origin",
	"protocol",
	"username",
	"password",
	"host",
	"hostname",
	"port",
	"pathname",
	"search",
	"searchParams",
	"hash",
]);
export const URL_METHODS: Set<string> = new Set(["toString", "toJSON"]);
export const URL_MEMBERS: Set<string> = new Set([...URL_PROPERTIES, ...URL_METHODS]);

export const URL_PARAMS_METHODS: Set<string> = new Set([
	"append",
	"delete",
	"get",
	"getAll",
	"has",
	"set",
	"sort",
	"entries",
	"forEach",
	"keys",
	"values",
	"toString",
]);
const URL_PARAMS_MUTATORS = new Set(["append", "delete", "set", "sort"]);

export function urlGet(
	data: ProxyData,
	target: URL,
	key: PropertyKey,
	wrap: (value: any) => any,
): any {
	trackProxySignal(data, URL_KEY);

	if (key === "searchParams") {
		const params = target.searchParams;
		if (data.shallow === true) return params;
		const proxy = wrap(params);
		const paramsData = (params as any)[proxyDataSymbol] as ProxyData | undefined;
		if (paramsData !== undefined) {
			paramsData.linkedUrlData = data;
			data.urlParamsData = paramsData;
		}
		return proxy;
	}

	if (URL_METHODS.has(key as string)) {
		return function (...args: any[]) {
			return (target as any)[key](...args);
		};
	}

	return (target as any)[key];
}

export function urlSet(data: ProxyData, target: URL, key: PropertyKey, value: any): boolean {
	const before = target.href;
	const descriptor =
		typeof key === "string" ? Object.getOwnPropertyDescriptor(URL.prototype, key) : undefined;

	if (descriptor?.set !== undefined) {
		descriptor.set.call(target, value);
	} else if (!Reflect.set(target, key, value, target)) {
		return false;
	}

	if (target.href !== before) {
		// Both signals are propagated in one batch so an effect that reads
		// both the URL and its params runs once
		batchStart();
		try {
			propagateSignal(data, URL_KEY);
			if (data.urlParamsData !== undefined) {
				propagateSignal(data.urlParamsData, URL_PARAMS_KEY);
			}
		} finally {
			batchEnd();
		}
	}
	return true;
}

function trackUrlParams(data: ProxyData): void {
	trackProxySignal(data, URL_PARAMS_KEY);
	if (data.linkedUrlData !== undefined) {
		trackProxySignal(data.linkedUrlData, URL_KEY);
	}
}

function propagateUrlParams(data: ProxyData): void {
	batchStart();
	try {
		propagateSignal(data, URL_PARAMS_KEY);
		if (data.linkedUrlData !== undefined) {
			propagateSignal(data.linkedUrlData, URL_KEY);
		}
	} finally {
		batchEnd();
	}
}

export function urlParamsGet(data: ProxyData, target: URLSearchParams, key: PropertyKey): any {
	if (key === "size") {
		trackUrlParams(data);
		return target.size;
	}

	if (key === Symbol.iterator) {
		trackUrlParams(data);
		return target[Symbol.iterator].bind(target);
	}

	return function (...args: any[]) {
		const method = key as string;
		if (URL_PARAMS_MUTATORS.has(method)) {
			const before = target.toString();
			const result = (target as any)[method](...args);
			if (target.toString() !== before) {
				propagateUrlParams(data);
			}
			return result;
		}
		trackUrlParams(data);
		return (target as any)[method](...args);
	};
}
