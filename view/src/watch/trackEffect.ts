import context from "../render/context";
import { type ProxyData } from "../types/ProxyData";

export default function trackEffect(data: ProxyData, key: PropertyKey) {
	// If there's an active effect, register this target/prop with it, so that
	// it will be called when this prop is set
	if (context.activeEffect) {
		//let effectName = String(context.activeEffect.run).split("{")[0].trim();
		//console.log(`tracking effect '${effectName}' for '${String(key)}'`);

		let propState = data.propData.get(key);
		if (!propState) {
			propState = { effects: [] };
			data.propData.set(key, propState);
		}

		propState.effects ||= [];
		propState.effects.push(context.activeEffect);

		context.activeEffect.props ||= [];
		context.activeEffect.props.push(propState);
	}
}
