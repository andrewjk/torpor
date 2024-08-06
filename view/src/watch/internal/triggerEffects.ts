import context from "../../global/context";

export default function triggerEffects(
  target: Record<string | symbol, any>,
  prop: string | symbol,
  alreadyTriggered?: any[],
) {
  // Get the properties with effect subscriptions for the target object
  let propSubscriptions = context.effectSubs.get(target["$target"] || target);
  if (propSubscriptions) {
    // Get the effect subscriptions for the supplied property
    let subscriptions = propSubscriptions.get(prop);
    if (subscriptions) {
      // Trigger each effect
      // TODO: can't loop, they may be removed?
      for (let effect of subscriptions) {
        // If this effect has already been triggered, skip it
        if (alreadyTriggered) {
          if (alreadyTriggered.includes(effect)) {
            continue;
          }
          alreadyTriggered.push(effect);
        }

        //console.log(`effect triggered for '${String(prop)}' on`, target, String(effect));

        // Run any cleanup function
        if (effect.cleanup) {
          effect.cleanup();
        }

        // Run the effect
        effect.run();
      }
    }
  }
}
