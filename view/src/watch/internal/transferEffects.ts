import Effect from "../../global/Effect";
import context from "../../global/context";
import { proxyTargetSymbol } from "./symbols";

export default function transferEffects(oldValue: Record<string | symbol, any>, newValue: any) {
  // Update effect subscriptions
  // NOTE: Effect subscriptions are keyed on the target object, not the proxy, so we need
  // to retrieve the target for the values first
  const oldTarget = oldValue[proxyTargetSymbol];
  const newValueIsNotNull = newValue != null;
  const newTarget = newValueIsNotNull ? newValue[proxyTargetSymbol] : null;
  const effectSubs = context.effectSubs.get(oldTarget);
  if (effectSubs) {
    // If the newValue is nullish, just delete the old target's prop effects,
    // as there are no props to track anymore (as there is no object)
    if (newValueIsNotNull) {
      moveChildEffects(effectSubs, oldValue, newValue);
      context.effectSubs.set(newTarget, effectSubs);
    }
    context.effectSubs.delete(oldTarget);
  }

  /*
  // TODO: Update range subscriptions somehow -- probably need a range array on the effect subscription
  // Could this be solved by combining ranges and effects??
  for (let [_, nodeEffects] of context.rangeEffectSubs) {
    for (let effect of nodeEffects) {
      if (effect.target === oldTarget) {
        //nodeEffects.delete(effect);
        effect.target = newTarget;
      }
    }
  }
  */
}

function moveChildEffects(
  objectEffects: Map<string | symbol, Effect[]>,
  oldValue: Record<string | symbol, any>,
  newValue: any,
) {
  // Set values of child properties that have effects, so that they will get updated too
  // TODO: Top down or bottom up?? Doing top down for now...
  for (let prop of objectEffects.keys()) {
    // HACK: can't set length to the old value...
    if (prop !== "length") {
      oldValue[prop] = newValue[prop];
    }
  }
}
