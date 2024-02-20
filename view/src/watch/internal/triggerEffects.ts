import hash from "../../compile/internal/hash";
import context from "./context";

export default function triggerEffects(
  target: Record<string | symbol, any>,
  prop: string | symbol,
) {
  // Get the properties with effect subscriptions for the target object
  let propSubscriptions = context.effectSubscriptions.get(target);
  if (propSubscriptions) {
    // Get the effect subscriptions for the supplied property
    let subscriptions = propSubscriptions.get(prop);
    if (subscriptions) {
      // Trigger each effect
      // TODO: can't foreach, they may be removed?
      subscriptions.forEach((effect) => {
        //if (subscriptions?.has(effect)) {
        // TODO: Proper tracking
        //  console.log(`running effect for '${String(prop)}' with value '${target[prop]}'`);
        effect();
        //} else {
        //  console.log(`NOT running effect for '${String(prop)}' with value '${target[prop]}'`);
        //}
      });
    }
  }
}
