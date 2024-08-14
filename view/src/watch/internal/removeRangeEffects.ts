import context from "../../global/context";
import type Range from "../../global/types/Range";

export default function removeRangeEffects(range: Range) {
  // Delete the effects for this range (which are keyed by target, property and effect)
  if (range.objectEffects) {
    for (let e of range.objectEffects) {
      let propEffects = context.objectEffects.get(e.target);
      if (propEffects) {
        let effects = propEffects.get(e.prop);
        if (effects) {
          let length = effects.length;
          for (let i = 0; i < length; i++) {
            if (effects[i] === e.effect) {
              // Run any cleanup function
              if (e.effect.cleanup) {
                e.effect.cleanup();
              }

              // Quick delete
              effects[i] = effects[length - 1];
              effects.pop();

              // If that was the last effect for this prop and/or object, delete them too
              if (!effects.length) {
                propEffects.delete(e.prop);
                if (!propEffects.size) {
                  context.objectEffects.delete(e.target);
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

  // Delete the effects for this range that have no object
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
