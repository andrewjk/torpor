import $watch from "../render/$watch";
import context from "../render/context";
import { type Computed } from "../types/Computed";
import { type ProxyData } from "../types/ProxyData";
import checkComputed from "./checkComputed";
import { proxyDataSymbol } from "./symbols";
import trackEffect from "./trackEffect";
import trackProxyEffect from "./trackProxyEffect";
import updateSignal from "./updateSignal";

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

	const propDescriptor = Object.getOwnPropertyDescriptor(target, key);
	if (propDescriptor !== undefined) {
		if (propDescriptor.writable) {
			if (!data.signals.has(key)) {
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
				data.signals.set(key, null);
			}

			// If a property is being accessed in the course of setting up an
			// effect, track it
			trackProxyEffect(data, key);
		} else if (propDescriptor.get) {
			// OK, we're only checking for computed values if it's read-only for
			// now, but we probably need to check any getter's value -- e.g. the
			// user may wish to add a setter to optimistically set a value, have
			// the UI update, then set the value concretely later (e.g. if
			// updating a `count` via a fetch)

			let signal = data.signals.get(key) as Computed | null;
			if (signal === undefined || signal === null) {
				let value: any;

				const oldRegisterComputed = context.registerComputed;
				try {
					// Allow calling `$cache` to assign the computed to a proxy
					// signal
					context.registerComputed = (computed: Computed) => {
						data.signals.set(key, computed);
					};

					value = Reflect.get(target, key, receiver);
				} finally {
					context.registerComputed = oldRegisterComputed;
				}

				return value;
			} else {
				if (signal.running) {
					throw new Error("Cycle detected");
				} else if (signal.recalc) {
					// If a signal that the computed depends on has been changed,
					// but the computed hasn't yet been read, it may need to be
					// re-computed
					checkComputed(signal);
				} else if (signal.didError) {
					// If there was a previous error, and no dependencies have
					// changed, throw the error again
					throw signal.value;
				} else {
					trackEffect(signal);
				}
			}

			// TODO: We should only check for dirty subs if a global int has
			// been incremented, ala Preact?

			return signal.value;
		}
	} else if (data.isArray) {
		// If it's a function in an array, we may intercept it
		if (arrayWrapper[key] !== undefined) {
			return arrayWrapper[key](data, target, key);
		}
	}

	// Return the property value
	return Reflect.get(target, key, receiver);
}

// Prevent array functions from calling functions and properties in breakable
// ways (e.g. calling splice sets length before adding items)
const arrayWrapper: Record<PropertyKey, any> = {
	[Symbol.iterator]: function (data: ProxyData, target: any, key: PropertyKey) {
		trackProxyEffect(data, "length");
		// HACK: This prevents lists being re-run on every random property
		// access by disabling the active effect before properties get
		// accessed. I'm not sure if this is the best way to achieve this...
		context.activeTarget = null;
		return target[key];
	},
	pop: arrayHandle,
	push: arrayHandle,
	reverse: arrayHandle,
	shift: arrayHandle,
	sort: arrayHandle,
	splice: arrayHandle,
	unshift: arrayHandle,
};

function arrayHandle(data: ProxyData, target: any, key: PropertyKey): Function {
	// Call the function on the target (so proxy properties don't get
	// intercepted) and trigger effects that depend on `length`
	return function (...args: any[]) {
		const func = target[key];
		const result = func.apply(target, args);
		updateSignal(data, "length");
		return result;
	};
}
