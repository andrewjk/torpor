import $watch from "../$watch";
import ProxyData from "../types/ProxyData";
import { proxyDataSymbol } from "./symbols";

/**
 * Transfers property effect subscriptions from one object to another
 */
export default function transferEffects(
	oldValue: Record<PropertyKey, any>,
	newValue: Record<PropertyKey, any>,
) {
	const oldData = oldValue[proxyDataSymbol] as ProxyData;
	const newData = newValue[proxyDataSymbol] as ProxyData;
	moveChildEffects(oldValue, newValue, oldData, newData);
}

function moveChildEffects(
	oldValue: Record<PropertyKey, any>,
	newValue: Record<PropertyKey, any>,
	oldData: ProxyData,
	newData: ProxyData,
) {
	// Recursively transfer and run effects for child properties
	// TODO: Top down or bottom up?? Doing top down for now...
	for (let key of oldData.propData.keys()) {
		let props = oldData.propData.get(key);
		if (props) {
			// Transfer the prop data
			newData.propData.set(key, props);

			let oldPropValue = oldValue[key];
			let oldPropData = oldPropValue[proxyDataSymbol];

			// If the old value was a proxy, make the new value one too
			// TODO: Make sure we aren't accidentally creating proxies for
			// things that weren't before...
			if (oldPropData) {
				newValue[key] = $watch(newValue[key]);
			}

			let newPropValue = newValue[key];

			// Run the effects for each property
			if (props.effects) {
				for (let effect of props.effects) {
					if (effect.cleanup) {
						effect.cleanup();
					}

					// Only run the effect if there is a new value
					if (newPropValue) {
						effect.run();
					}
				}
			}

			// Recurse
			if (oldPropData) {
				let newPropData = newPropValue[proxyDataSymbol];
				moveChildEffects(oldPropValue, newPropValue, oldPropData, newPropData);
			}
		}
	}
}
