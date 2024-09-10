import $watch from "../$watch";
import ProxyState from "../../global/types/ProxyState";
import { proxyStateSymbol } from "./symbols";
import transferEffects from "./transferEffects";
import triggerEffects from "./triggerEffects";

export default function proxySet(
	target: Record<PropertyKey, any>,
	prop: PropertyKey,
	value: any,
	receiver: any,
	state: ProxyState,
) {
	//console.log(`object set '${String(prop)}' to '${value}' on`, target);

	// Only do things if the value has changed
	const oldValue = target[prop];
	if (value !== oldValue) {
		let newValue = value;

		// If the value was previously a proxy, watch the new value and update
		// its effect subscriptions
		if (oldValue && oldValue[proxyStateSymbol]) {
			newValue = $watch(value);
			transferEffects(oldValue, newValue);
		}

		// Set the property value on the target
		Reflect.set(target, prop, newValue, receiver);

		// Re-run effects
		triggerEffects(state, prop);
	}

	return true;
}
