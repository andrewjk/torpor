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
 * nearest `@await` boundary.
 *
 * Return value (stale-while-revalidate, ASYNC.md §6.2): on a refresh suspend
 * (the computed has resolved before) returns the previously resolved value
 * held in `staleValue`, so readers keep displaying the old content instead of
 * a placeholder — an `@await` boundary thus keeps its content mounted
 * rather than flashing the `with` branch. On a first load (`staleValue` is
 * undefined) returns `undefined`, which the boundary replaces with its
 * `with` branch. In peek mode (used by `$pending`) always returns `undefined`
 * — the value isn't needed, only the subscription.
 */
function suspendRead(signal: Computed): any {
	trackSignal(signal);
	// In peek mode (used by $pending), track the signal for subscription but
	// don't taint the reader or notify the boundary. Record a "loud" hit only
	// for non-quiet suspends — a silent refresh (suspendQuiet) stays quiet per
	// ASYNC.md §7.4, so $pending returns false for it. The signal is still
	// tracked above so $pending re-evaluates when the silent refresh resolves.
	if (context.suspendPeek) {
		if (!signal.suspendQuiet) {
			context.suspendPeekHit = true;
		}
		return undefined;
	}
	if (context.activeTarget !== null) {
		context.activeTarget.didSuspend = true;
	}
	if (context.awaitBoundary !== null) {
		context.awaitBoundary.suspended = true;
		// Subscribe the boundary effect to this computed so the boundary
		// re-runs when the promise resolves. Without this, the subscription
		// would only exist on child effects that are destroyed when content
		// is cleared.
		const boundaryEffect = context.awaitBoundary.effect;
		if (boundaryEffect !== null && boundaryEffect !== context.activeTarget) {
			const oldActive = context.activeTarget;
			context.activeTarget = boundaryEffect;
			trackSignal(signal);
			context.activeTarget = oldActive;
		}
	}
	return signal.staleValue;
}

/**
 * Deep-wraps a value with `$watch` if it is a plain object that is not already
 * watched and is not a promise. Returns the value unchanged otherwise.
 */
function deepWrap(value: any): any {
	return value !== undefined &&
		value !== null &&
		typeof value === "object" &&
		value[proxyDataSymbol] === undefined &&
		// But not if it's a Promise (i.e. has a `then` method)
		value.then === undefined
		? $watch(value)
		: value;
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
					const wrapped = deepWrap(value);
					if (wrapped !== value) {
						target[key] = wrapped;
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
					// Allow calling `$cache`/`$async` to assign the computed to a
					// proxy signal
					context.registerComputed = (computed: Computed) => {
						data.signals.set(key, computed);
					};
					const result = Reflect.get(target, key, receiver);
					// After running the getter, check if the just-registered
					// computed suspended (e.g. an $async getter returning a
					// pending promise). If so, handle suspend instead of
					// returning the raw promise.
					const registered = data.signals.get(key) as Computed | undefined;
					if (
						context.refreshSignals !== null &&
						registered !== undefined &&
						registered.type === COMPUTED_TYPE &&
						registered.isAsync
					) {
						// $refresh collection: record the $async computed (this is
						// the first-ever read, so it isn't in data.signals yet).
						// suspendRead below still runs in peek mode ($refresh sets
						// suspendPeek), so no taint/boundary notification happens.
						context.refreshSignals.push(registered);
					}
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
		// The signal may have been created for a PREVIOUS value at this key —
		// e.g. the property was reassigned to a raw object that skipped the
		// `set` trap's re-wrap (the trap only re-wraps when the OLD value was
		// a proxy). Make sure the current value is deep-wrapped, the same as
		// the first-read path above
		if (data.shallow !== true) {
			const value = target[key];
			const wrapped = deepWrap(value);
			if (wrapped !== value) {
				target[key] = wrapped;
			}
		}

		// If a property is being accessed in the course of setting up an
		// effect, track it
		trackProxySignal(data, key);
	} else if (signal.type === COMPUTED_TYPE) {
		if (context.refreshSignals !== null && signal.isAsync) {
			// $refresh collection: record the $async computed so it can be
			// re-run as a bare refresh, then return its current value without
			// recalc/taint/boundary handling — collection is a pure peek. fn's
			// result is ignored by $refresh, so the value is only read to
			// trigger the same read path a UI read would.
			context.refreshSignals.push(signal);
			return signal.value;
		}
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
			// changed, throw the error again. Subscribe first so the reader
			// re-runs if the computed later recovers (e.g. via a `$refresh`
			// that resolves a fresh fetch) — without this, the reader loses
			// its subscription on the throwing read and recovery can never
			// reach it.
			trackSignal(signal);
			throw signal.value;
		}
		if (signal.didSuspend) {
			// The computed returned a pending promise — subscribe the reader
			// (so resolve re-runs it), taint up the cache chain, and notify
			// the nearest  boundary
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
					if (data.shallow !== true) {
						const wrapped = deepWrap(value);
						if (wrapped !== value) {
							value = wrapped;
							target[index] = value;
						}
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
