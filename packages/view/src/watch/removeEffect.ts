import { type Effect } from "../types/Effect";

export default function removeEffect(effect: Effect): void {
	//let effectName = String(effect.run).split("{")[0].trim();
	//console.log(`removing effect '${effectName}'`);

	// Run any cleanup function
	if (effect.cleanup) {
		effect.cleanup();
	}

	// Delete the effect from any props that are subscribed to it
	if (effect.props) {
		for (let prop of effect.props) {
			if (prop.effects) {
				let length = prop.effects.length;
				let i = length;
				while (i--) {
					if (prop.effects[i] === effect) {
						prop.effects[i] = prop.effects[length - 1];
						prop.effects.pop();
						length -= 1;
					}
				}
				// TODO: should ideally delete the prop if there
				// are no more subscriptions??
			}
		}
	}

	// HACK: Set the effect to active = false for loops through sliced arrays
	// TODO: Proper signal tracking
	effect.active = false;
}
