import $watch from "../$watch";
import ProxyData from "../types/ProxyData";
import { proxyDataSymbol } from "./symbols";
import transferEffects from "./transferEffects";
import triggerEffects from "./triggerEffects";

export default function proxySet(
	target: Record<PropertyKey, any>,
	key: PropertyKey,
	value: any,
	receiver: any,
	data: ProxyData,
) {
	//console.log(`object set '${String(prop)}' to '`, value, `' on`, target);

	// Only do things if the value has changed
	const oldValue = target[key];
	if (value !== oldValue) {
		let newValue = value;

		// If the value was previously a proxy, watch the new value and update
		// its effect subscriptions
		if (oldValue && oldValue[proxyDataSymbol]) {
			newValue = $watch(value);
			transferEffects(oldValue, newValue);
		}

		// Set the property value on the target
		Reflect.set(target, key, newValue, receiver);

		// Re-run effects
		triggerEffects(data, key);

		// If an item in an array is being set directly, trigger the length to
		// cause any lists to be re-run and data re-bound
		// TODO: Can we update the single item's data directly somehow?
		if (data.isArray && !isNaN(+String(key))) {
			triggerEffects(data, "length");
		}
	}

	return true;
}
