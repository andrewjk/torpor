import devContext from "../dev/devContext";
import context from "../render/context";
import deepWrap from "./deepWrap";
//import transferEffects from "./transferEffects";
import propagateSignal from "./propagateSignal";
import { proxyDataSymbol } from "./symbols";

export default function proxySet(
	target: Record<PropertyKey, any>,
	key: PropertyKey,
	value: any,
	receiver: any,
): boolean {
	//console.log(`object set '${String(key)}' to`, value, "on", target);
	//console.log(`object set '${String(key)}'`);

	// Only do things if the value has changed
	const oldValue = target[key];
	if (value !== oldValue) {
		if (context.batchOperation > 100) {
			throw new Error("Cycle detected");
		}

		let data = target[proxyDataSymbol];

		// DEV:
		devContext.signalSet(data, key);

		// Wrap the new value if it's an object (plain objects, arrays, Dates,
		// Maps, Sets), so storing it and mutating it through the proxy is
		// reactive right away -- same as the `get` trap's deep-wrap on read.
		// Skipped for shallow watches, whose children stay unwrapped.
		// NOTE: this is mostly an ergonomics/consistency win (raw values
		// assigned here used to leak out of raw-target paths like the array
		// `slice`/`map` handles). The `get` trap's lazy wrap still covers the
		// common read paths, so if profiling ever shows this line being slow
		// (it allocates a proxy per assigned object), just delete it and
		// everything reverts to wrap-on-read
		if (data.shallow !== true) {
			value = deepWrap(value);
			//transferEffects(oldValue, value);
		}

		// Set the property value on the target
		Reflect.set(target, key, value, receiver);

		// Re-run effects
		propagateSignal(data, key);

		// If an item in an array is being set directly, trigger the length to
		// cause any lists to be re-run and data re-bound
		// TODO: Can we update the single item's data directly somehow?
		if (data.isArray && typeof key !== "symbol" && !isNaN(+key)) {
			propagateSignal(data, "length");
		}
	}

	return true;
}
