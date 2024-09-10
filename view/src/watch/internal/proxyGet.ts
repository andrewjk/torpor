import $watch from "../$watch";
import context from "../../global/context";
import ProxyState from "../../global/types/ProxyState";
import { proxyStateSymbol } from "./symbols";
import trackEffect from "./trackEffect";
import triggerEffects from "./triggerEffects";

export default function proxyGet(
	target: Record<PropertyKey, any>,
	prop: PropertyKey,
	receiver: any,
	state: ProxyState,
) {
	if (prop === proxyStateSymbol) {
		return state;
	}

	//console.log(`object get '${String(prop)}' on`, target);

	// Set the value to a new proxy if it's an object
	// But not if it's a Promise (i.e. has a `then` method)
	if (!state.props.has(prop)) {
		let value = target[prop];
		if (value && typeof value === "object" && !value[proxyStateSymbol] && !value.then) {
			target[prop] = $watch(value);
		}
		state.props.set(prop, null);
	}

	// From https://stackoverflow.com/a/54136394
	// PERF: Because we know what methods are being called, we could potentially run them manually
	//       on DOM nodes (i.e. if it's a splice, we know which to remove and add etc)
	if (state.isArray) {
		if (
			prop === "pop" ||
			prop === "push" ||
			prop === "reverse" ||
			prop === "shift" ||
			prop === "sort" ||
			prop === "splice" ||
			prop === "unshift"
		) {
			// Get the array method
			const targetFunction: Function = target[prop];

			// Run the array method
			return function (...args: any[]) {
				targetFunction.apply(target, args);

				// If this array has change functions, call them now via the
				// length property, which gets accessed in most functions
				triggerEffects(state, "length");
			};
		} else if (prop === Symbol.iterator) {
			// HACK: This prevents lists being re-run on every random property
			// access by disabling the active effect before properties get
			// accessed. I'm not sure if this is the best way to achieve this...
			trackEffect(state, "length");
			context.activeEffect = null;
		} else {
			// If this property is being accessed in the course of setting up an effect, track it
			// TODO: Only if it's a property and not a function?
			trackEffect(state, prop);
		}
	} else {
		// If this property is being accessed in the course of setting up an effect, track it
		// TODO: Only if it's a property and not a function?
		trackEffect(state, prop);
	}

	// Return the property value
	return Reflect.get(target, prop, receiver);
}
