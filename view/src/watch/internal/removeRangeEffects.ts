import type Range from "../../global/Range";
import context from "../../global/context";

export default function removeRangeEffects(range: Range) {
  // Delete the effect subcriptions for this range (which are keyed by target, property and effect)
  if (range.objectEffects) {
    range.objectEffects.forEach((e) => {
      let propSubscriptions = context.effectSubs.get(e.target);
      if (propSubscriptions) {
        let subscriptions = propSubscriptions.get(e.prop);
        if (subscriptions) {
          if (subscriptions.delete(e.effect)) {
            // Run any cleanup function
            if (e.effect.cleanup) {
              e.effect.cleanup();
            }

            // If that was the last effect for this subscription, delete the subscription too
            if (!subscriptions.size) {
              propSubscriptions.delete(e.prop);
              if (!propSubscriptions.size) {
                context.effectSubs.delete(propSubscriptions);
              }
            }
          }
        }
      }
    });

    //printContext(`removed effect for '${range.title}'`);
  }

  // Delete the effects for this range that have no effects
  if (range.emptyEffects) {
    range.emptyEffects.forEach((effect) => {
      // Run any cleanup function
      if (effect.cleanup) {
        effect.cleanup();
      }
    });
  }

  // Delete the effects for each child of this range, along with the children
  if (range.children) {
    range.children.forEach((child, i) => {
      removeRangeEffects(child);
    });
    range.children.length = 0;
  }
}
