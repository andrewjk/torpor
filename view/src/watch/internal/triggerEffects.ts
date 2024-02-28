import hash from "../../compile/internal/hash";
import context from "./context";

export default function triggerEffects(
  target: Record<string | symbol, any>,
  prop: string | symbol,
) {
  // Get the properties with effect subscriptions for the target object
  let propSubscriptions = context.effectSubs.get(target);
  if (propSubscriptions) {
    // Get the effect subscriptions for the supplied property
    let subscriptions = propSubscriptions.get(prop);
    if (subscriptions) {
      // Trigger each effect
      // TODO: can't foreach, they may be removed?
      subscriptions.forEach((effect) => {
        // Run any cleanup function
        const cleanup = context.effectCleanups.get(effect);
        if (cleanup) cleanup();
        // Run the effect
        effect();
      });
    }
  }
}
