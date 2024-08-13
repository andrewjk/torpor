import context from "../../global/context";

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
      for (let effect of subscriptions) {
        //const effectName = /function (.+?) \{/g.exec(String(effect.run))![1];
        //console.log(`effect '${effectName}' triggered for '${String(prop)}'`);
        //console.log(`  on`, JSON.stringify(target));

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
