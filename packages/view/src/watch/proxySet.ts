import context from "../render/context";
import $watch from "./$watch";
//import transferEffects from "./transferEffects";
import propagateSignal from "./propagateSignal";
import { proxyDataSymbol } from "./symbols";

export default function proxySet(
	target: Record<PropertyKey, any>,
	key: PropertyKey,
	value: any,
	receiver: any,
): boolean {
	//console.log(`object set '${String(key)}' to '`, value, `' on`, target);
	//console.log(`object set '${String(key)}'`);

	// Only do things if the value has changed
	const oldValue = target[key];
	if (value !== oldValue) {
		if (context.batchOperation > 100) {
			throw new Error("Cycle detected");
		}

		let data = target[proxyDataSymbol];

		// If the value was previously a proxy, watch the new value and update
		// its effect subscriptions
		if (oldValue && oldValue[proxyDataSymbol] !== undefined) {
			value = $watch(value, { shallow: oldValue[proxyDataSymbol].shallow });
			//transferEffects(oldValue, newValue);
		}

		// Set the property value on the target
		Reflect.set(target, key, value, receiver);

		// Re-run effects
		propagateSignal(data, key);

		// If an item in an array is being set directly, trigger the length to
		// cause any lists to be re-run and data re-bound
		// TODO: Can we update the single item's data directly somehow?
		if (data.isArray && !isNaN(+String(key))) {
			propagateSignal(data, "length");
		}
	}

	return true;
}
