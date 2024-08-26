import context from "../../global/context";

export default function trackEffect(target: Record<string | symbol, any>, prop: string | symbol) {
	//console.log(`tracking effect for '${String(prop)}' with value '${target[prop]}'`);

	// If there's an active effect, register this target/prop with it, so that
	// it will be called when this prop is set
	if (context.activeEffect) {
		context.activeEffectSubbed = true;

		// Get the properties with effects for the target object
		let propEffects = context.objectEffects.get(target);
		if (!propEffects) {
			propEffects = new Map();
			context.objectEffects.set(target, propEffects);
		}

		// Get the effects for the supplied property
		let effects = propEffects.get(prop);
		if (!effects) {
			effects = [];
			propEffects.set(prop, effects);
		}

		// TODO: Do we need to be checking duplicates?
		if (!effects.includes(context.activeEffect)) {
			effects.push(context.activeEffect);
		}

		// If there's an active range, register the active effect with it, so that
		// it will be cleaned up when the range is removed
		if (context.activeRange) {
			const effectPath = {
				target,
				prop,
				effect: context.activeEffect,
			};
			context.activeRange.objectEffects = context.activeRange.objectEffects || [];
			context.activeRange.objectEffects.push(effectPath);
		}

		//printContext(`added effect for '${String(prop)}' with value '${target[prop]}'`);
	}
}
