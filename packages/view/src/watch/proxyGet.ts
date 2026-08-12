import context from "../render/context";
import type Computed from "../types/Computed";
import type ProxyData from "../types/ProxyData";
import { COMPUTED_TYPE, SIGNAL_TYPE } from "../types/constants";
import $watch from "./$watch";
import checkComputed from "./checkComputed";
import propagateSignal from "./propagateSignal";
import { proxyDataSymbol } from "./symbols";
import trackProxySignal from "./trackProxySignal";
import trackSignal from "./trackSignal";

/**
 * Called when a read hits a `didSuspend` computed. Subscribes the reader (so
 * resolve re-runs it through the normal reactive graph), propagates the
 * suspend up the cache chain by tainting the active reader, and notifies the
 * nearest `@loading` boundary. Returns `undefined` as a placeholder — the
 * boundary discards the partial render.
 */
function suspendRead(signal: Computed): undefined {
	trackSignal(signal);
	if (context.activeTarget !== null) {
		context.activeTarget.didSuspend = true;
	}
	if (context.loadingBoundary !== null) {
		context.loadingBoundary.suspended = true;
	}
	return undefined;
}

export default function proxyGet(
	target: Record<PropertyKey, any>,
	key: PropertyKey,
	receiver: any,
): any {
	let data: ProxyData = target[proxyDataSymbol];

	if (key === proxyDataSymbol) {
		return data;
	}

	//console.log(`object get '${String(key)}' on`, target);
	//console.log(`object get '${String(key)}'`);

	let signal = data.signals.get(key);
	if (signal === undefined) {
		const propDescriptor = Object.getOwnPropertyDescriptor(target, key);
		if (propDescriptor !== undefined) {
			if (propDescriptor.writable) {
				// Setup data for the property
				if (data.shallow !== true) {
					// Set the value to a new proxy if it's an object
					const value = target[key];
					if (
						value !== undefined &&
						value !== null &&
						typeof value === "object" &&
						value[proxyDataSymbol] === undefined &&
						// But not if it's a Promise (i.e. has a `then` method)
						value.then === undefined
					) {
						target[key] = $watch(value);
					}
				}

				// If a property is being accessed in the course of setting up an
				// effect, track it
				trackProxySignal(data, key);
			} else if (propDescriptor.get) {
				// OK, we're only checking for computed values if it's read-only for
				// now, but we probably need to check any getter's value -- e.g. the
				// user may wish to add a setter to optimistically set a value, have
				// the UI update, then set the value concretely later (e.g. if
				// updating a `count` via a fetch)

			const oldRegisterComputed = context.registerComputed;
			try {
				// Allow calling `$cache`/`$await` to assign the computed to a
				// proxy signal
				context.registerComputed = (computed: Computed) => {
					data.signals.set(key, computed);
				};
				const result = Reflect.get(target, key, receiver);
				// After running the getter, check if the just-registered
				// computed suspended (e.g. an $await getter returning a
				// pending promise). If so, handle suspend instead of
				// returning the raw promise.
				const registered = data.signals.get(key) as Computed | undefined;
				if (
					registered !== undefined &&
					registered.type === COMPUTED_TYPE &&
					registered.didSuspend
				) {
					return suspendRead(registered);
				}
				return result;
			} finally {
				context.registerComputed = oldRegisterComputed;
			}
			}
		} else if (data.isArray) {
			// If it's a function in an array, we may intercept it
			if (arrayWrapper[key] !== undefined) {
				return arrayWrapper[key](data, target, key);
			}
		} else {
			// If it's a non-existent property we still set up a subscription so
			// that if its value is set to something it will re-run the effect
			trackProxySignal(data, key);
		}
	} else if (signal.type === SIGNAL_TYPE) {
		// If a property is being accessed in the course of setting up an
		// effect, track it
		trackProxySignal(data, key);
	} else if (signal.type === COMPUTED_TYPE) {
		if (signal.running) {
			throw new Error("Cycle detected");
		} else if (signal.recalc) {
			// If a signal that the computed depends on has been changed,
			// but the computed hasn't yet been read, it may need to be
			// re-computed
			checkComputed(signal);
		}
		if (signal.didError) {
			// If there was a previous error, and no dependencies have
			// changed, throw the error again
			throw signal.value;
		}
		if (signal.didSuspend) {
			// The computed returned a pending promise — subscribe the reader
			// (so resolve re-runs it), taint up the cache chain, and notify
			// the nearest @loading boundary
			return suspendRead(signal);
		}
		trackSignal(signal);
		return signal.value;
	}

	// Return the property value
	// NOTE: equivalent to `Reflect.get(target, key, receiver)` for the cases
	// that reach here (data properties or missing keys — anything with a
	// getter has early-returned above). Avoids a `Reflect.get` function call
	// per property read on a watched object, which is the dominant per-effect-
	// run cost: each row effect reads `$state.selected`, `data.row.id`, and
	// `data.row.label` (the `.row` access goes through this trap), so a 1k-row
	// render triggers ~3k of these calls.
	return target[key];
}

// Prevent array functions from calling functions and properties in breakable
// ways (e.g. calling splice sets length before adding items)
const arrayWrapper: Record<PropertyKey, any> = {
	// Iterating a watched array (`for…of`, spread, `Array.from`) must NOT walk
	// the proxy per element. The old path returned `Array.prototype[Symbol.iterator]`
	// unchanged, so for-of invoked it with the PROXY as `this` and every element
	// read `proxy[i]` hit the `get` trap (descriptor lookup, deep-wrap checks,
	// per-index signal creation, Map ops) — a 1k-row list cost ~100x the raw
	// iteration. Lists re-iterate their source array on EVERY run (the
	// compiler-emitted `buildItems`), making this the dominant cost of pure
	// bookkeeping ops (rotate/remove).
	//
	// Instead we iterate the RAW target directly and lazily `$watch`-wrap each
	// element, writing the proxy back (`target[i] = proxy`) exactly like the
	// `get` trap does on first access. That keeps a SINGLE proxy instance per
	// element, so in-place mutation (`$state.data[i].label = …`) still reaches
	// the row effects that subscribed through `item.data.row`, while skipping
	// the per-element trap entirely. `data.shallow` arrays are left unwrapped,
	// matching the `get` trap's deep-only behaviour.
	[Symbol.iterator]: function (data: ProxyData, target: any, _key: PropertyKey) {
		trackProxySignal(data, "length");
		// HACK: This prevents lists being re-run on every random property
		// access by disabling the active effect before properties get
		// accessed. I'm not sure if this is the best way to achieve this...
		context.activeTarget = null;
		return function arrayIterator() {
			let index = 0;
			return {
				next() {
					if (index >= target.length) return { value: undefined, done: true };
					let value = target[index];
					if (
						data.shallow !== true &&
						value !== undefined &&
						value !== null &&
						typeof value === "object" &&
						value[proxyDataSymbol] === undefined &&
						// But not if it's a Promise (i.e. has a `then` method)
						value.then === undefined
					) {
						value = $watch(value);
						target[index] = value;
					}
					// Mirror the `get` trap's per-index signal creation (a plain
					// index is never subscribed during iteration — activeTarget is
					// null — but keeping the signal means a later direct `arr[i]`
					// read inside an effect reuses it, exactly as before).
					trackProxySignal(data, String(index));
					index++;
					return { value, done: false };
				},
				[Symbol.iterator]() {
					return this;
				},
			};
		};
	},
	pop: arrayHandle,
	push: arrayHandle,
	reverse: arrayHandle,
	shift: arrayHandle,
	sort: arrayHandle,
	splice: arrayHandle,
	unshift: arrayHandle,
	// Read-only methods must also run on the raw target. `slice`/`filter`/`concat`
	// etc. called on the proxy walk every element through the `get` trap — the
	// same ~100x penalty — for nothing, since their results are either assigned
	// back into `$state.data` (re-wrapped by `$watch` in the `set` trap) or read
	// transiently. Running them on the raw array keeps the elements' proxy
	// identity unchanged (wrapped elements stay wrapped; raw elements stay raw
	// until the next iteration wraps them).
	slice: readHandle,
	concat: readHandle,
	filter: readHandle,
	map: readHandle,
	toReversed: readHandle,
	toSorted: readHandle,
	toSpliced: readHandle,
	indexOf: readHandle,
	lastIndexOf: readHandle,
	includes: readHandle,
	find: readHandle,
	findIndex: readHandle,
	some: readHandle,
	every: readHandle,
	join: readHandle,
	forEach: readHandle,
	reduce: readHandle,
	reduceRight: readHandle,
	flat: readHandle,
	flatMap: readHandle,
	at: readHandle,
};

function readHandle(data: ProxyData, target: any, key: PropertyKey): Function {
	// Call the function on the target (so proxy properties don't get
	// intercepted). Read-only, so no `length` propagation — but an effect that
	// READS the array through one of these (`items.join("")`, `items.slice(1)`)
	// must still subscribe to `length` so it re-runs on push/splice/index-set
	// (every array mutation propagates `length`). When no effect is active this
	// is a cheap no-op.
	return function (...args: any[]) {
		trackProxySignal(data, "length");
		const func = target[key];
		return func.apply(target, args);
	};
}

function arrayHandle(data: ProxyData, target: any, key: PropertyKey): Function {
	// Call the function on the target (so proxy properties don't get
	// intercepted) and trigger effects that depend on `length`
	return function (...args: any[]) {
		const func = target[key];
		const result = func.apply(target, args);
		propagateSignal(data, "length");
		return result;
	};
}
