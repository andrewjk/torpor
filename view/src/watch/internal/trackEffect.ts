import context from "./context";
import printContext from "./printContext";

export default function trackEffect(target: Record<string | symbol, any>, prop: string | symbol) {
  //console.log(`tracking effect for '${String(prop)}' with value '${target[prop]}'`);

  // If there's an active effect, register this target/prop with it,
  // so that it will be called when this prop is set
  if (context.activeEffect) {
    context.activeEffectSubbed = true;

    // Get the properties with effect subscriptions for the target object
    let propSubscriptions = context.effectSubs.get(target);
    if (!propSubscriptions) {
      propSubscriptions = new Map();
      context.effectSubs.set(target, propSubscriptions);
    }

    // Get the effect subscriptions for the supplied property
    let subscriptions = propSubscriptions.get(prop);
    if (!subscriptions) {
      subscriptions = new Set();
      propSubscriptions.set(prop, subscriptions);
    }

    // TODO: Do we need to be checking duplicates?
    if (!subscriptions.has(context.activeEffect)) {
      subscriptions.add(context.activeEffect);
    }

    // If there's an active DOM range, register the active effect with it,
    // so that it will be cleaned up when the range is removed
    if (context.activeRange) {
      let rangeEffects = context.rangeEffectSubs.get(context.activeRange);
      const subscriptionPointer = {
        target,
        prop,
        effect: context.activeEffect,
      };
      if (!rangeEffects) {
        rangeEffects = new Set();
        context.rangeEffectSubs.set(context.activeRange, rangeEffects);
      }
      rangeEffects.add(subscriptionPointer);
    }

    //printContext(`added effect for '${String(prop)}' with value '${target[prop]}'`);
  }
}
