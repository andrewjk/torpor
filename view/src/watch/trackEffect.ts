import context from "../render/context";
import Effect from "../types/Effect";
import ProxyData from "../types/ProxyData";

export default function trackEffect(data: ProxyData, key: PropertyKey) {
	//console.log(`tracking effect for '${String(prop)}' with value '${target[prop]}'`);

	// If there's an active effect, register this target/prop with it, so that
	// it will be called when this prop is set
	if (context.activeEffect) {
		let propState = data.propData.get(key);
		if (!propState) {
			propState = { effects: [] };
			data.propData.set(key, propState);
		}

		// Get the effects for the supplied property
		propState.effects ||= [];

		// TODO: Do we need to be checking duplicates?
		//if (!effects.includes(context.activeEffect)) {
		propState.effects.push(context.activeEffect);
		//}

		context.activeEffect.props ||= [];
		context.activeEffect.props.push(propState);
	}
}
