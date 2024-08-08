import context from "../../global/context";
import { proxyTargetSymbol } from "./symbols";

export default function triggerEffects(
  target: Record<string | symbol, any>,
  prop: string | symbol,
) {
  // Get the properties with effect subscriptions for the target object
  let propSubscriptions = context.effectSubs.get(target[proxyTargetSymbol] || target);
  if (propSubscriptions) {
    // Get the effect subscriptions for the supplied property
    let subscriptions = propSubscriptions.get(prop);
    if (subscriptions) {
      // Trigger each effect
      for (let effect of subscriptions) {
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
