import { type ProxyData } from "../types/ProxyData";
import removeEffect from "./removeEffect";
import runEffect from "./runEffect";

export default function triggerEffects(data: ProxyData, key: PropertyKey) {
	// Get the effects for the supplied property
	let effects = data.propData.get(key)?.effects;
	if (effects) {
		// HACK: Slice the array to get a copy, so that we can remove effects from
		// the property in removeEffect without skipping any here
		for (let effect of effects.slice()) {
			if (effect.active) {
				//let effectName = String(effect.run).split("{")[0].trim();
				//console.log(`triggered effect '${effectName}' for '${String(key)}'`);

				removeEffect(effect);

				runEffect(effect);
			}
		}
	}
}
