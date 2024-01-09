import context from "./context";

export default function getSubscriptions(
  target: Record<string, any>,
  key: string,
): Set<() => void> {
  // Get the properties with effect subscriptions for the target object
  let propsMap = context.subscriptions.get(target);
  if (!propsMap) {
    propsMap = new Map();
    context.subscriptions.set(target, propsMap);
  }

  // Get the effect subscriptions for the property with the supplied key
  let effectsSet = propsMap.get(key);
  if (!effectsSet) {
    effectsSet = new Set();
    propsMap.set(key, effectsSet);
  }

  return effectsSet;
}
