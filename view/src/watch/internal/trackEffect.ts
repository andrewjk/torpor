import context from "./context";

export default function trackEffect(target: Record<string | symbol, any>, prop: string | symbol) {
  // If there's an active effect, register this target/prop with it,
  // so that it will be called when this prop is set
  if (context.activeEffect) {
    // Get the properties with effect subscriptions for the target object
    let propSubscriptions = context.effectSubscriptions.get(target);
    if (!propSubscriptions) {
      propSubscriptions = new Map();
      context.effectSubscriptions.set(target, propSubscriptions);
    }

    // Get the effect subscriptions for the supplied property
    let subscriptions = propSubscriptions.get(prop);
    if (!subscriptions) {
      subscriptions = new Set();
      propSubscriptions.set(prop, subscriptions);
    }

    if (!subscriptions.has(context.activeEffect)) {
      subscriptions.add(context.activeEffect);
    }

    // If there's an active DOM node, register the active effect with it,
    // so that it will be cleaned up when the node is removed
    if (context.activeNode) {
      //console.log(`registering effect with node for '${prop}' with value '${target[prop]}'`);
      let nodeEffects = context.nodeEffects.get(context.activeNode);
      const subscriptionPointer = {
        target,
        prop,
        effect: context.activeEffect,
      };
      if (nodeEffects) {
        // de-dupe -- I think this wouldn't be necessary if we put anchors inside branches??
        let addEffect = true;
        for (let eff of nodeEffects.effects) {
          if (eff.target === target && eff.prop === prop && eff.effect === context.activeEffect) {
            addEffect = false;
            break;
          }
        }
        if (addEffect) {
          nodeEffects.effects.add(subscriptionPointer);
        }
      } else {
        nodeEffects = {
          children: [],
          effects: new Set(),
        };
        nodeEffects.effects.add(subscriptionPointer);
        context.nodeEffects.set(context.activeNode, nodeEffects);
      }
    }
  }
}
