import context from "./context";

export default function removeNodeEffects(node: Node) {
  let nodeEffects = context.nodeEffects.get(node);
  if (nodeEffects) {
    nodeEffects.children.forEach((child, i) => {
      removeNodeEffects(child);
      // @ts-ignore Make sure it's not held onto
      nodeEffects.children[i] = undefined;
    });
    nodeEffects.effects.forEach((e) => {
      // Get the properties with effect subscriptions for the target object
      let propSubscriptions = context.effectSubscriptions.get(e.target);
      if (propSubscriptions) {
        // Get the effect subscriptions for the supplied property
        let subscriptions = propSubscriptions.get(e.prop);
        if (subscriptions) {
          // Delete the subscriptions
          if (subscriptions.delete(e.effect)) {
            if (!subscriptions.size) {
              propSubscriptions.delete(e.prop);
              if (!propSubscriptions.size) {
                context.effectSubscriptions.delete(propSubscriptions);
              }
            }
          }
        }
      }
    });
    context.nodeEffects.delete(node);
    //printContext(`removed effect for '${node.textContent}'`);
  }
}
