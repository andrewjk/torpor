import context from "./context";

export default function updateEffects(oldValue: Record<string | symbol, any>, value: any) {
  // Update effect subscriptions
  // NOTE: Effect subscriptions are keyed on the target object, not the proxy, so we need
  // to retrieve the target for the old value first
  const oldTarget = oldValue["$target"];
  const effectSubscription = context.effectSubscriptions.get(oldTarget);
  if (effectSubscription) {
    context.effectSubscriptions.set(value, effectSubscription);
    context.effectSubscriptions.delete(oldTarget);
  }

  // TODO: Update node subscriptions somehow -- probably need a node array on the effect subscription
  for (let [_, nodeEffects] of context.rangeEffects) {
    for (let effect of nodeEffects) {
      if (effect.target === oldTarget) {
        //nodeEffects.delete(effect);
        effect.target = value;
      }
    }
  }
}
