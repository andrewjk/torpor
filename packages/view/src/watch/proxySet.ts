import devContext from "../dev/devContext";
import deepWrap from "./deepWrap";
import propagateSignal from "./propagateSignal";
import { proxyArrayContentSymbol, proxyDataSymbol, proxyKeysSymbol } from "./symbols";

export default function proxySet(
	target: Record<PropertyKey, any>,
	key: PropertyKey,
	value: any,
	receiver: any,
): boolean {
	//console.log(`object set '${String(key)}' to`, value, "on", target);
	//console.log(`object set '${String(key)}'`);

	// Only do things if the value has changed. `Object.is` rather than `!==`
	// so writing the same `NaN` doesn't notify (NaN !== NaN)
	const oldValue = target[key];
	if (!Object.is(value, oldValue)) {
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
		}

		// Adding a key changes the key set, so effects that enumerated the
		// object (`Object.keys` etc.) must re-run. (Checked before the set:
		// `ownKeys`-visible membership is what changed, value or not.)
		const isNewKey = !Object.prototype.hasOwnProperty.call(target, key);

		// A direct array index write replaces an element. Capture the length
		// first: only a write that extends the array changes it.
		const isArrayIndex = data.isArray && typeof key !== "symbol" && !isNaN(+key);
		const oldLength = isArrayIndex ? (target as any).length : 0;

		// Set the property value on the target
		Reflect.set(target, key, value, receiver);

		// Re-run effects
		propagateSignal(data, key);
		if (isNewKey) {
			propagateSignal(data, proxyKeysSymbol);
		}

		if (isArrayIndex) {
			// Iteration and read methods re-run because an element changed...
			propagateSignal(data, proxyArrayContentSymbol);
			// ...but `length` readers (e.g. `items.length`, and lists that
			// only care about adding/removing rows) only when the write
			// actually changed the length
			if ((target as any).length !== oldLength) {
				propagateSignal(data, "length");
			}
		}
	}

	return true;
}
