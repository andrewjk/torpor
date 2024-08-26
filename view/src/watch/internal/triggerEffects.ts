import context from "../../global/context";

export default function triggerEffects(
	target: Record<string | symbol, any>,
	prop: string | symbol,
) {
	// Get the properties with effects for the target object
	let objectEffects = context.objectEffects.get(target);
	if (objectEffects) {
		// Get the effects for the supplied property
		let effects = objectEffects.get(prop);
		if (effects) {
			// Trigger each effect
			for (let effect of effects) {
				//const effectName = /function (.+?) \{/g.exec(String(effect.run))![1];
				//console.log(`effect '${effectName}' triggered for '${String(prop)}'`);
				//console.log(`  on`, JSON.stringify(target));

				// Run any cleanup function
				if (effect.cleanup) {
					effect.cleanup();
				}

				// Set the active effect just in case there are new items that need to
				// be subscribed to (e.g. when iterating an array)
				context.activeEffect = effect;

				// Run the effect
				effect.run();

				context.activeEffect = null;
			}
		}
	}
}
