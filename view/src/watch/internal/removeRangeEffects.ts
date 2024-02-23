import type Range from "./Range";
import context from "./context";
import printContext from "./printContext";

export default function removeRangeEffects(range: Range) {
  let rangeEffects = context.rangeEffects.get(range);
  if (rangeEffects) {
    // Delete the effect subcriptions for this range (which are keyed by target, property and effect)
    rangeEffects.forEach((e) => {
      let propSubscriptions = context.effectSubscriptions.get(e.target);
      if (propSubscriptions) {
        let subscriptions = propSubscriptions.get(e.prop);
        if (subscriptions) {
          if (subscriptions.delete(e.effect)) {
            // If that was the last effect for this subscription, delete the subscription too
            if (!subscriptions.size) {
              propSubscriptions.delete(e.prop);
              if (!propSubscriptions.size) {
                context.effectSubscriptions.delete(propSubscriptions);
              }
            }
          }
        }
      }
    });

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

    // Delete this range from the range effects collection
    context.rangeEffects.delete(range);

    //printContext(`removed effect for '${range.title}'`);
  }
}
