import context from "../render/context";
import type Computed from "../types/Computed";
import type Effect from "../types/Effect";
import type ProxyData from "../types/ProxyData";
import { COMPUTED_TYPE, EFFECT_TYPE, SIGNAL_TYPE } from "../types/constants";
import { AwaitSuspend } from "../render/AwaitSuspend";
import batchEnd from "./batchEnd";
import batchStart from "./batchStart";
import checkComputed from "./checkComputed";
import deepWrap, { isWrappedProxy } from "./deepWrap";
import $unwrap from "./$unwrap";
import propagateSignal from "./propagateSignal";
import { proxyDataSymbol, proxyKeysSymbol } from "./symbols";
import trackProxySignal, { ensureProxySignal } from "./trackProxySignal";
import trackSignal from "./trackSignal";

/**
 * Called when a read hits a `didSuspend` computed. Subscribes the reader (so
 * resolve re-runs it through the normal reactive graph), propagates the
 * suspend up the cache chain by tainting the active reader, and notifies the
 * nearest `@await` boundary.
 *
 * Return value (ASYNC.md → "Stale-while-revalidate"): on a refresh suspend
 * (the computed has settled before) returns the previously resolved value
 * held in `settle`, so readers keep displaying the old content instead of
 * a placeholder — an `@await` boundary thus keeps its content mounted
 * rather than flashing the `with` branch. On a first load (or a retry after a
 * rejection, both of which have no stale value), inside an `@await` boundary,
 * throws `AwaitSuspend` to abort the speculative content render so the
 * boundary can show its `with` branch — a direct `undefined` return would
 * make user code that dereferences the value throw a `TypeError` first. In
 * peek mode (used by `$pending`) always returns `undefined` — the value isn't
 * needed, only the subscription.
 */
function suspendRead(signal: Computed): any {
	trackSignal(signal);
	// In peek mode (used by $pending), track the signal for subscription but
	// don't taint the reader or notify the boundary. Record a "loud" hit only
	// for non-quiet suspends — a silent refresh (suspendQuiet) stays quiet per
	// ASYNC.md → "Loud vs quiet"), so $pending returns false for it. The signal is still
	// tracked above so $pending re-evaluates when the silent refresh resolves.
	if (context.suspendPeek) {
		if (!signal.suspendQuiet) {
			context.suspendPeekHit = true;
		}
		return undefined;
	}
	if (context.activeTarget !== null) {
		context.activeTarget.didSuspend = true;
		if (context.activeTarget.type === EFFECT_TYPE) {
			// Record the suspended read on the effect, so `triggerEffects`
			// can re-subscribe it if the run crashes with no error boundary
			// to handle the error — otherwise the crash would detach the
			// subscription above and the effect would never re-run on
			// resolve
			const effect = context.activeTarget as Effect;
			(effect.suspendSources ??= new Set()).add(signal);
		}
	}
	if (context.awaitBoundary !== null) {
		context.awaitBoundary.suspended = true;
		// Record the suspended computed on the boundary, so its effect can
		// re-check (and re-subscribe to) just the pending reads on each
		// re-run instead of walking its whole source list
		context.awaitBoundary.pending.add(signal);
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
		// First load (or a retry after a rejection, which leaves no settled
		// value): there is no value to display, and returning `undefined`
		// would let dereferences throw before the boundary can switch
		// branches. Abort the speculative render instead.
		if (signal.settle === undefined || !signal.settle.ok) {
			throw new AwaitSuspend();
		}
	}
	// Stale-while-revalidate: the last resolved value, if any. `undefined`
	// before the first settle and after a rejection.
	return signal.settle !== undefined && signal.settle.ok ? signal.settle.value : undefined;
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

	// Dates, Maps and Sets can't be proxied transparently -- their prototype
	// methods (`getFullYear`, `get`, `size`...) throw when invoked with the
	// proxy as `this`, because they need internal slots of the raw object --
	// so method access is routed through wrapper handlers instead. Own
	// properties set by user code (`date.foo = 1`) still go through the
	// generic property path below.
	if (
		(data.isDate || data.isMap || data.isSet) &&
		!Object.prototype.hasOwnProperty.call(target, key)
	) {
		return collectionGet(data, target, key, receiver);
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
						// The collection read itself just initialized this computed
						// — its fetch is already in flight, so $refresh must not
						// re-run it (that would start a duplicate fetch whose
						// resolve the generation guard would drop)
						context.refreshInitialized?.add(registered);
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
		// e.g. the property was assigned between reads. Make sure the current
		// value is deep-wrapped, the same as the first-read path above -- but
		// only for writable own data properties, since prototype accessors
		// (e.g. a DOM node's `parentElement`) can't be written back
		if (data.shallow !== true) {
			const value = target[key];
			if (typeof value === "object" && value !== null) {
				const propDescriptor = Object.getOwnPropertyDescriptor(target, key);
				if (propDescriptor !== undefined && propDescriptor.writable) {
					const wrapped = deepWrap(value);
					if (wrapped !== value) {
						target[key] = wrapped;
					}
				}
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
	//
	// The iteration subscribes the reading effect to `length` only — every
	// array mutation notifies `length` (push/splice via `arrayHandle`, direct
	// index assignment via the `set` trap), so that is all a `for…of` depends
	// on. Reads made in the loop body (and everything after the iteration)
	// stay tracked like any other effect read; the list's own item-building
	// key reads are untracked by the compiler instead (see `buildForNode`).
	[Symbol.iterator]: function (data: ProxyData, target: any, _key: PropertyKey) {
		trackProxySignal(data, "length");
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
					// Create the per-index signal (without subscribing) so a later
					// direct `arr[i]` read inside an effect reuses it, exactly as
					// before
					ensureProxySignal(data, String(index));
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
	// same ~100x penalty. Running them on the raw array avoids that, but the
	// elements handed to callbacks and returned to the caller must still be
	// proxies (otherwise reads inside a callback aren't tracked, and mutating a
	// returned element doesn't notify): `readHandle` wraps each element lazily
	// before calling the method, writing the proxy back exactly like the
	// iterator does.
	slice: readHandle,
	concat: readHandle,
	filter: readHandle,
	map: readHandle,
	toReversed: readHandle,
	toSorted: readHandle,
	toSpliced: readHandle,
	indexOf: searchHandle,
	lastIndexOf: searchHandle,
	includes: searchHandle,
	find: readHandle,
	findIndex: readHandle,
	some: readHandle,
	every: readHandle,
	join: joinHandle,
	forEach: readHandle,
	reduce: readHandle,
	reduceRight: readHandle,
	flat: readHandle,
	flatMap: readHandle,
	at: atHandle,
};

/**
 * Wraps (and writes back) every object element of a raw array, so callback
 * parameters and returned values are reactive proxies — the same lazy wrapping
 * the iterator does. Skipped entirely once every element is wrapped (the
 * `elementsWrapped` flag, reset by mutations that can insert raw elements);
 * `isWrappedProxy` skips elements that are already proxies without reading
 * through their `get` trap. Shallow arrays are left unwrapped to match the
 * `get` trap's deep-only behaviour.
 */
function wrapArrayElements(data: ProxyData, target: any[]): void {
	if (data.shallow === true || data.elementsWrapped === true) return;
	const length = target.length;
	for (let i = 0; i < length; i++) {
		const value = target[i];
		if (value !== null && typeof value === "object" && !isWrappedProxy(value)) {
			const wrapped = deepWrap(value);
			if (wrapped !== value) {
				target[i] = wrapped;
			}
		}
	}
	data.elementsWrapped = true;
}

function readHandle(data: ProxyData, target: any, key: PropertyKey): Function {
	// Call the function on the target (so proxy properties don't get
	// intercepted). Read-only, so no `length` propagation — but an effect that
	// READS the array through one of these (`items.join("")`, `items.slice(1)`)
	// must still subscribe to `length` so it re-runs on push/splice/index-set
	// (every array mutation propagates `length`). When no effect is active this
	// is a cheap no-op.
	return function (...args: any[]) {
		trackProxySignal(data, "length");
		wrapArrayElements(data, target);
		const func = target[key];
		return func.apply(target, args);
	};
}

function joinHandle(data: ProxyData, target: any, key: PropertyKey): Function {
	// Like `readHandle`, but without wrapping: `join` only produces a string,
	// so the elements never need proxies.
	return function (...args: any[]) {
		trackProxySignal(data, "length");
		const func = target[key];
		return func.apply(target, args);
	};
}

/**
 * `indexOf` / `lastIndexOf` / `includes`.
 *
 * Elements are wrapped lazily, so the array can hold raw objects or their
 * proxies — and a raw search value can miss the proxy that replaced it (or a
 * proxy can miss the raw object it wraps). On a miss with an object argument,
 * retry with the unwrapped and wrapped forms.
 */
function searchHandle(data: ProxyData, target: any, key: PropertyKey): Function {
	return function (...args: any[]) {
		trackProxySignal(data, "length");
		const search = args[0];
		const func = target[key];
		const found = func.apply(target, args);
		if ((found === -1 || found === false) && search !== null && typeof search === "object") {
			for (const candidate of [$unwrap(search), deepWrap(search)]) {
				if (candidate === search) continue;
				const result = func.apply(target, [candidate, ...args.slice(1)]);
				if (result !== -1 && result !== false) return result;
			}
		}
		return found;
	};
}

/**
 * `at`: like a direct `arr[i]` read, but it wraps just the element it returns
 * (a whole-array wrap would turn the O(1) lookup into O(n)).
 */
function atHandle(data: ProxyData, target: any, _key: PropertyKey): Function {
	return function (index?: number) {
		trackProxySignal(data, "length");
		const length = target.length;
		let i = Math.trunc(Number(index ?? 0)) || 0;
		if (i < 0) i += length;
		if (i < 0 || i >= length) return undefined;
		let value = target[i];
		if (data.shallow !== true) {
			const wrapped = deepWrap(value);
			if (wrapped !== value) {
				value = wrapped;
				target[i] = value;
			}
		}
		return value;
	};
}

function arrayHandle(data: ProxyData, target: any, key: PropertyKey): Function {
	// Call the function on the target (so proxy properties don't get
	// intercepted) and trigger effects that depend on `length`
	return function (...args: any[]) {
		// These can insert raw elements (`push(…)`, `unshift(…)`, `splice(…,
		// …, item)`), so the array must be re-scanned before read methods hand
		// its elements to callbacks again
		if (key === "push" || key === "unshift" || key === "splice") {
			data.elementsWrapped = false;
		}
		const func = target[key];
		const result = func.apply(target, args);
		propagateSignal(data, "length");
		// Structural mutations (push/pop/shift/unshift/splice) change the key
		// set, so effects that enumerated the array (`Object.keys` etc.) must
		// re-run too. sort/reverse keep the same keys, so they don't notify
		// the key-set signal
		if (key !== "sort" && key !== "reverse") {
			propagateSignal(data, proxyKeysSymbol);
		}
		return result;
	};
}

// #region Date/Map/Set wrappers

// Signal key for collection-wide reads (`size`, iteration). Also the fallback
// per-key signal for keys that aren't primitives (object keys can't be signal
// keys, since `data.signals` is keyed by PropertyKey)
const COLLECTION_KEY = Symbol("torp.collection");
// Signal key for all Date reads/writes (a Date only has one value, its time)
const TIME_KEY = "#time";

/**
 * Routes a `get` on a watched Date/Map/Set to the right wrapper handler.
 *
 * Note the two levels of indirection for methods: the handler runs at get-trap
 * time (returning the method to call), and the returned function runs when the
 * method is invoked. `size` is the exception -- it returns its value at
 * get-trap time, because it's a readonly property, not a method.
 */
function collectionGet(data: ProxyData, target: any, key: PropertyKey, receiver: any): any {
	if (data.isDate) {
		return dateGet(data, target, key);
	}
	const wrapper = data.isMap ? mapWrapper : setWrapper;
	const handle = wrapper[key];
	if (handle !== undefined) {
		return handle(data, target, key, receiver);
	}
	return target[key];
}

/**
 * Returns the signal key for a Map/Set operation: primitives get a per-key
 * signal, so reading one key doesn't re-run effects when an unrelated key
 * changes. Anything else shares the collection-wide signal.
 */
function collectionKey(key: any): PropertyKey {
	const type = typeof key;
	return type === "string" || type === "number" || type === "symbol" ? key : COLLECTION_KEY;
}

/**
 * Propagates a Map/Set mutation: the per-key signal (when the key is a
 * primitive) plus the collection-wide signal. The collection signal is always
 * enough for object keys, and propagating the same signal twice would re-run
 * effects twice (they re-subscribe between flushes).
 */
function propagateCollection(data: ProxyData, key: PropertyKey): void {
	if (key !== COLLECTION_KEY) {
		propagateSignal(data, key);
	}
	propagateSignal(data, COLLECTION_KEY);
}

function dateGet(data: ProxyData, target: any, key: PropertyKey): any {
	if (typeof key === "symbol") {
		// `Symbol.toPrimitive` is looked up by the language itself for `==`
		// comparisons, arithmetic, template literals and JSON.stringify. It
		// must be invoked on the raw target (internal slots), and reading it
		// counts as a read of the date's value
		if (key === Symbol.toPrimitive) {
			return function (hint: string) {
				const result = target[Symbol.toPrimitive](hint);
				trackProxySignal(data, TIME_KEY);
				return result;
			};
		}
		return target[key];
	}
	if (typeof key !== "string") {
		return target[key];
	}
	const value = target[key];
	if (typeof value !== "function") {
		return value;
	}
	if (key.startsWith("set")) {
		return function (...args: any[]) {
			// Only propagate if the time actually changed, so setting the same
			// value is a no-op (same as the `set` trap)
			const before = target.getTime();
			const result = value.apply(target, args);
			if (target.getTime() !== before) {
				propagateSignal(data, TIME_KEY);
			}
			return result;
		};
	}
	if (key.startsWith("get") || key.startsWith("to") || key === "valueOf") {
		return function (...args: any[]) {
			const result = value.apply(target, args);
			trackProxySignal(data, TIME_KEY);
			return result;
		};
	}
	return value;
}

const mapWrapper: Record<PropertyKey, any> = {
	size: function (data: ProxyData, target: any): number {
		trackProxySignal(data, COLLECTION_KEY);
		return target.size;
	},
	get: function (data: ProxyData, target: any): Function {
		return function (key: any) {
			key = $unwrap(key);
			trackProxySignal(data, collectionKey(key));
			const value = target.get(key);
			if (data.shallow !== true) {
				// Deep-wrap the value and write the proxy back, so repeated
				// reads return the same proxy (same as array elements)
				const wrapped = deepWrap(value);
				if (wrapped !== value) {
					target.set(key, wrapped);
				}
				return wrapped;
			}
			return value;
		};
	},
	has: function (data: ProxyData, target: any): Function {
		return function (key: any) {
			key = $unwrap(key);
			trackProxySignal(data, collectionKey(key));
			return target.has(key);
		};
	},
	set: function (data: ProxyData, target: any, _key: PropertyKey, receiver: any): Function {
		return function (key: any, value: any) {
			key = $unwrap(key);
			// Only propagate if the value actually changed or the key is new
			// (same as the `set` trap). Note a stored value may be a proxy
			// (see `get`), so unwrap both sides before comparing
			if (target.has(key) && $unwrap(target.get(key)) === $unwrap(value)) {
				return receiver ?? target;
			}
			// A watched object is stored as its proxy, so reads return it
			// reactively (same as array elements written back by the iterator)
			const result = target.set(key, value);
			propagateCollection(data, collectionKey(key));
			// Map.set returns the map for chaining -- return the proxy so
			// chained mutations stay reactive
			return receiver ?? result;
		};
	},
	delete: function (data: ProxyData, target: any): Function {
		return function (key: any) {
			key = $unwrap(key);
			const result = target.delete(key);
			// Deleting a missing key changes nothing, so don't re-run
			// size/iteration readers for it
			if (result) {
				propagateCollection(data, collectionKey(key));
			}
			return result;
		};
	},
	clear: function (data: ProxyData, target: any): Function {
		return function () {
			const result = target.clear();
			// Per-key readers must re-run too, and the keys are gone, so
			// propagate every signal this collection created -- in one batch,
			// so readers of several signals re-run only once
			batchStart();
			try {
				for (const key of data.signals.keys()) {
					propagateSignal(data, key);
				}
			} finally {
				batchEnd();
			}
			return result;
		};
	},
	keys: function (data: ProxyData, target: any): Function {
		return function () {
			trackProxySignal(data, COLLECTION_KEY);
			return [...target.keys()][Symbol.iterator]();
		};
	},
	values: function (data: ProxyData, target: any): Function {
		return function () {
			trackProxySignal(data, COLLECTION_KEY);
			let values = [...target.values()];
			if (data.shallow !== true) {
				values = values.map(deepWrap);
			}
			return values[Symbol.iterator]();
		};
	},
	entries: mapEntries,
	// Map's default iteration protocol yields entries
	[Symbol.iterator]: mapEntries,
	forEach: function (data: ProxyData, target: any, _key: PropertyKey, receiver: any): Function {
		return function (callback: (value: any, key: any, collection: any) => void, thisArg?: any) {
			trackProxySignal(data, COLLECTION_KEY);
			const wrap = data.shallow !== true;
			target.forEach((value: any, key: any) => {
				callback.call(thisArg, wrap ? deepWrap(value) : value, key, receiver ?? target);
			});
		};
	},
};

function mapEntries(data: ProxyData, target: any): Function {
	return function () {
		trackProxySignal(data, COLLECTION_KEY);
		const wrap = data.shallow !== true;
		const entries = [...target.entries()].map((entry) => [
			entry[0],
			wrap ? deepWrap(entry[1]) : entry[1],
		]);
		return entries[Symbol.iterator]();
	};
}

const setWrapper: Record<PropertyKey, any> = {
	size: function (data: ProxyData, target: any): number {
		trackProxySignal(data, COLLECTION_KEY);
		return target.size;
	},
	has: function (data: ProxyData, target: any): Function {
		return function (value: any) {
			value = $unwrap(value);
			trackProxySignal(data, collectionKey(value));
			return target.has(value);
		};
	},
	add: function (data: ProxyData, target: any, _key: PropertyKey, receiver: any): Function {
		return function (value: any) {
			value = $unwrap(value);
			// Adding an existing element is a no-op (same as the `set` trap)
			if (target.has(value)) {
				return receiver ?? target;
			}
			const result = target.add(value);
			propagateCollection(data, collectionKey(value));
			// Set.add returns the set for chaining -- return the proxy so
			// chained mutations stay reactive
			return receiver ?? result;
		};
	},
	delete: function (data: ProxyData, target: any): Function {
		return function (value: any) {
			value = $unwrap(value);
			const result = target.delete(value);
			// Deleting a missing element changes nothing, so don't re-run
			// size/iteration readers for it
			if (result) {
				propagateCollection(data, collectionKey(value));
			}
			return result;
		};
	},
	clear: function (data: ProxyData, target: any): Function {
		return function () {
			const result = target.clear();
			// Per-element readers must re-run too, and the elements are gone,
			// so propagate every signal this collection created -- in one
			// batch, so readers of several signals re-run only once
			batchStart();
			try {
				for (const key of data.signals.keys()) {
					propagateSignal(data, key);
				}
			} finally {
				batchEnd();
			}
			return result;
		};
	},
	// Sets yield the same elements from keys/values/iteration -- all wrapped,
	// so mutating an element re-runs readers
	keys: setValues,
	values: setValues,
	[Symbol.iterator]: setValues,
	entries: setEntries,
	forEach: function (data: ProxyData, target: any, _key: PropertyKey, receiver: any): Function {
		return function (callback: (value: any, value2: any, collection: any) => void, thisArg?: any) {
			trackProxySignal(data, COLLECTION_KEY);
			const wrap = data.shallow !== true;
			target.forEach((value: any) => {
				const wrapped = wrap ? deepWrap(value) : value;
				callback.call(thisArg, wrapped, wrapped, receiver ?? target);
			});
		};
	},
};

function setValues(data: ProxyData, target: any): Function {
	return function () {
		trackProxySignal(data, COLLECTION_KEY);
		let values = [...target.values()];
		if (data.shallow !== true) {
			values = values.map(deepWrap);
		}
		return values[Symbol.iterator]();
	};
}

function setEntries(data: ProxyData, target: any): Function {
	return function () {
		trackProxySignal(data, COLLECTION_KEY);
		const wrap = data.shallow !== true;
		const entries = [...target.values()].map((value) => {
			const wrapped = wrap ? deepWrap(value) : value;
			return [wrapped, wrapped];
		});
		return entries[Symbol.iterator]();
	};
}

// #endregion
