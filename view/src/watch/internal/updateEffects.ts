import context from "../../global/context";

export default function updateEffects(oldValue: Record<string | symbol, any>, newValue: any) {
  // Update effect subscriptions
  // NOTE: Effect subscriptions are keyed on the target object, not the proxy, so we need
  // to retrieve the target for the values first
  const oldTarget = oldValue["$target"];
  const newTarget = newValue["$target"] || newValue;
  const effectSubs = context.effectSubs.get(oldTarget);
  //console.log("moving subs from", oldTarget, "to", newTarget);
  if (effectSubs) {
    //console.log("moved", effectSubs.size, "subs from", oldTarget, "to", newTarget);
    context.effectSubs.set(newTarget, effectSubs);
    context.effectSubs.delete(oldTarget);
  }

  // TODO: Update node subscriptions somehow -- probably need a node array on the effect subscription
  for (let [_, nodeEffects] of context.rangeEffectSubs) {
    for (let effect of nodeEffects) {
      if (effect.target === oldTarget) {
        //nodeEffects.delete(effect);
        effect.target = newTarget;
      }
    }
  }
}
