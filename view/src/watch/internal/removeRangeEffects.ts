import type Range from "./Range";
import context from "./context";

export default function removeRangeEffects(range: Range) {
  // Delete the effect subcriptions for this range (which are keyed by target, property and effect)
  const rangeEffectSubs = context.rangeEffectSubs.get(range);
  if (rangeEffectSubs) {
    rangeEffectSubs.forEach((e) => {
      let propSubscriptions = context.effectSubs.get(e.target);
      if (propSubscriptions) {
        let subscriptions = propSubscriptions.get(e.prop);
        if (subscriptions) {
          if (subscriptions.delete(e.effect)) {
            // Run any cleanup function
            const cleanup = context.effectCleanups.get(e.effect);
            if (cleanup) {
              cleanup();
              context.effectCleanups.delete(e.effect);
            }

            // Delete the effect
            context.effectCleanups.delete(e.effect);

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

    // Delete this range from the range effects collection
    context.rangeEffectSubs.delete(range);

    //printContext(`removed effect for '${range.title}'`);
  }

  // Delete the effects for this range that have no effects
  const rangeEffects = context.rangeEffects.get(range);
  if (rangeEffects) {
    rangeEffects.forEach((e) => {
      // Run any cleanup function
      const cleanup = context.effectCleanups.get(e);
      if (cleanup) {
        cleanup();
        context.effectCleanups.delete(e);
      }

      // Delete the effect
      context.effectCleanups.delete(e);
    });

    // Delete this range from the range effects collection
    context.rangeEffects.delete(range);
  }

  // Delete the effects for each child of this range, along with the children
  if (range.children) {
    range.children.forEach((child, i) => {
      removeRangeEffects(child);
      // @ts-ignore Make sure it's not held onto
      range.children[i] = undefined;
    });
  }

  // Delete this range from its parent's children collection
  if (range.parent && range.parent.children) {
    let index = range.parent.children.indexOf(range);
    if (index === -1) {
      throw new Error("Range not found among parent's children");
    }
    range.parent.children.splice(index, 1);
  }
}
