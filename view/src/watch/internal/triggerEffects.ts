import ProxyState from "../../global/types/ProxyState";

export default function triggerEffects(state: ProxyState, prop: PropertyKey) {
	// Get the effects for the supplied property
	let effects = state.props.get(prop)?.effects;
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
