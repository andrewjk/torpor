import type { ProxyData } from "../types/ProxyData";
import { proxyDataSymbol, proxyHandledSymbol } from "../watch/symbols";
import trackProxyEffect from "../watch/trackProxyEffect";
import updateSignal from "../watch/updateSignal";

// NOTE: this is mostly copied from SvelteDate, without the memoization
// I'm not 100% sold on it, maybe it would be better to intercept $watch calls on a Date?

let initialized = false;

/**
 * Wraps a Date object for $watching.
 */
export default class ReactiveDate extends Date {
	constructor(...params: any[]) {
		// @ts-ignore
		super(...params);

		if (!initialized) {
			this.#init();
		}

		// @ts-ignore
		this[proxyHandledSymbol] = true;
		// @ts-ignore
		this[proxyDataSymbol] = {
			target: this,
			isArray: false,
			shallow: true,
			signals: new Map(),
		} satisfies ProxyData;
	}

	#init() {
		initialized = true;

		let reactivePrototype = ReactiveDate.prototype;
		let datePrototype = Date.prototype;

		const methods = Object.getOwnPropertyNames(datePrototype);

		for (const method of methods) {
			if (method.startsWith("get") || method.startsWith("to") || method === "valueOf") {
				// @ts-ignore
				reactivePrototype[method] = function (...args) {
					// @ts-ignore
					const data = this[proxyDataSymbol];
					// @ts-ignore
					const result = datePrototype[method].apply(this, args);
					trackProxyEffect(data, "#time");
					return result;
				};
			}

			if (method.startsWith("set")) {
				// @ts-ignore
				reactivePrototype[method] = function (...args) {
					// @ts-ignore
					const data = this[proxyDataSymbol];
					// @ts-ignore
					const result = datePrototype[method].apply(this, args);
					updateSignal(data, "#time");
					return result;
				};
			}
		}
	}
}
