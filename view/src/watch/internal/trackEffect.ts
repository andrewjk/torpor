import context from "../../global/context";
import ProxyState from "../../global/types/ProxyState";

export default function trackEffect(state: ProxyState, prop: PropertyKey) {
	//console.log(`tracking effect for '${String(prop)}' with value '${target[prop]}'`);

	// If there's an active effect, register this target/prop with it, so that
	// it will be called when this prop is set
	if (context.activeEffect) {
		let propState = state.props.get(prop);
		if (!propState) {
			propState = { effects: [] };
			state.props.set(prop, propState);
		}

		// Get the effects for the supplied property
		propState.effects ||= [];

		// TODO: Do we need to be checking duplicates?
		//if (!effects.includes(context.activeEffect)) {
		propState.effects.push(context.activeEffect);
		//}

		context.activeEffect.props ||= [];
		context.activeEffect.props.push(propState);

		//printContext(`added effect for '${String(prop)}' with value '${target[prop]}'`);
	}
}
