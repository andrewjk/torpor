import ProxyData from "../../global/types/ProxyData";

export default function triggerEffects(data: ProxyData, key: PropertyKey) {
	// Get the effects for the supplied property
	let effects = data.propData.get(key)?.effects;
	if (effects) {
		for (let effect of effects) {
			//const effectName = /function (.+?) \{/g.exec(String(effect.run))![1];
			//console.log(`effect '${effectName}' triggered for '${String(prop)}'`);
			//console.log(`  on`, JSON.stringify(target));

			// Run any cleanup function
			if (effect.cleanup) {
				effect.cleanup();
			}

			// Run the effect
			effect.run();
		}
	}
}
