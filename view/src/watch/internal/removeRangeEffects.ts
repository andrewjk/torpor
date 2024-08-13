import context from "../../global/context";
import type Range from "../../global/types/Range";

export default function removeRangeEffects(range: Range) {
  // Delete the effect subcriptions for this range (which are keyed by target, property and effect)
  if (range.objectEffects) {
    for (let e of range.objectEffects) {
      let propSubscriptions = context.effectSubs.get(e.target);
      if (propSubscriptions) {
        let subscriptions = propSubscriptions.get(e.prop);
        if (subscriptions) {
          let length = subscriptions.length;
          for (let i = 0; i < length; i++) {
            if (subscriptions[i] === e.effect) {
              // Run any cleanup function
              if (e.effect.cleanup) {
                e.effect.cleanup();
              }

              // Quick delete
              subscriptions[i] = subscriptions[length - 1];
              subscriptions.pop();

              // If that was the last effect for this subscription, delete the subscription too
              if (!subscriptions.length) {
                propSubscriptions.delete(e.prop);
                if (!propSubscriptions.size) {
                  context.effectSubs.delete(e.target);
                }
              }

              break;
            }
          }
        }
      }
    }

    //printContext(`removed effect for '${range.title}'`);
  }

  // Delete the effects for this range that have no effects
  if (range.emptyEffects) {
    for (let effect of range.emptyEffects) {
      // Run any cleanup function
      if (effect.cleanup) {
        effect.cleanup();
      }
    }
  }

  // Delete the effects for each child of this range
  if (range.children) {
    for (let child of range.children) {
      removeRangeEffects(child);
    }
    range.children.length = 0;
  }
}
