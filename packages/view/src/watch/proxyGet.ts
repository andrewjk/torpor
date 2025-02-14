import $watch from "../render/$watch";
import context from "../render/context";
import { type ProxyData } from "../types/ProxyData";
import { proxyDataSymbol } from "./symbols";
import trackEffect from "./trackEffect";
import triggerEffects from "./triggerEffects";

export default function proxyGet(
	target: Record<PropertyKey, any>,
	key: PropertyKey,
	receiver: any,
	data: ProxyData,
) {
	if (key === proxyDataSymbol) {
		return data;
	}

	//console.log(`object get '${String(prop)}' on`, target);

	// Set the value to a new proxy if it's an object
	// But not if it's a Promise (i.e. has a `then` method)
	if (!data.propData.has(key)) {
		if (!data.shallow) {
			let value = target[key];
			if (value && typeof value === "object" && !value[proxyDataSymbol] && !value.then) {
				target[key] = $watch(value);
			}
		}
		data.propData.set(key, null);
	}

	// From https://stackoverflow.com/a/54136394
	// PERF: Because we know what methods are being called, we could potentially run them manually
	//       on DOM nodes (i.e. if it's a splice, we know which to remove and add etc)
	if (data.isArray) {
		if (
			key === "pop" ||
			key === "push" ||
			key === "reverse" ||
			key === "shift" ||
			key === "sort" ||
			key === "splice" ||
			key === "unshift"
		) {
			// Get the array method
			const targetFunction: Function = target[key];

			// Run the array method
			return function (...args: any[]) {
				targetFunction.apply(target, args);

				// If this array has change functions, call them now via the
				// length property, which gets accessed in most functions
				triggerEffects(data, "length");
			};
		} else if (key === Symbol.iterator) {
			// HACK: This prevents lists being re-run on every random property
			// access by disabling the active effect before properties get
			// accessed. I'm not sure if this is the best way to achieve this...
			trackEffect(data, "length");
			context.activeEffect = null;
		} else {
			// If this property is being accessed in the course of setting up an effect, track it
			// TODO: Only if it's a property and not a function?
			trackEffect(data, key);
		}
	} else {
		// If this property is being accessed in the course of setting up an effect, track it
		// TODO: Only if it's a property and not a function?
		trackEffect(data, key);
	}

	// Return the property value
	return Reflect.get(target, key, receiver);
}
