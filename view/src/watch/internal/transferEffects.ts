import ProxyState from "../../global/types/ProxyState";
import { proxyStateSymbol } from "./symbols";

/**
 * Transfers property effect subscriptions from one object to another
 */
export default function transferEffects(
	oldValue: Record<PropertyKey, any>,
	newValue: Record<PropertyKey, any>,
) {
	if (newValue) {
		const oldState = oldValue[proxyStateSymbol] as ProxyState;
		const newState = newValue[proxyStateSymbol] as ProxyState;
		moveChildEffects(oldValue, newValue, oldState, newState);
		// TODO: Maybe only transfer these if they are applicable
		//newState.props = oldState.props;
	} else {
		// TODO: Should we clear the old effects?
	}
}

function moveChildEffects(
	oldValue: Record<PropertyKey, any>,
	newValue: Record<PropertyKey, any>,
	oldState: ProxyState,
	newState: ProxyState,
) {
	// Set values of child properties that have effects, so that they will get updated too
	// TODO: Top down or bottom up?? Doing top down for now...
	if (oldState.isArray) {
		for (let prop of oldState.props.keys()) {
			if (prop === "length") {
				// Can't set length to the old value, but do transfer its effects
				newState.props.set(prop, oldState.props.get(prop)!);
			} else if (+String(prop) >= newValue.length) {
				// Skip properties past the end of the new value
			} else {
				// Set the old value to the new value, and transfer effects
				oldValue[prop] = newValue[prop];
				newState.props.set(prop, oldState.props.get(prop)!);
			}
		}
	} else {
		for (let prop of oldState.props.keys()) {
			// Set the old value to the new value, and transfer effects
			oldValue[prop] = newValue[prop];
			newState.props.set(prop, oldState.props.get(prop)!);
		}
	}
}
