import type Range from "../../global/types/Range";

export default function removeRangeEffects(range: Range) {
	// Delete the effects for this range
	if (range.effects) {
		for (let effect of range.effects) {
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
		}

		range.effects.length = 0;
	}

	// Delete the effects for each child of this range
	if (range.children) {
		for (let child of range.children) {
			removeRangeEffects(child);
		}
		range.children.length = 0;
	}
}
