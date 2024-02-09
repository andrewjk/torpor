import getSubscriptions from "./getSubscriptions";

export default function triggerEffects(target: Record<string, any>, key: string) {
  const subscriptions = getSubscriptions(target, key);
  subscriptions.forEach((effect) => {
    // TODO: Proper tracking
    //console.log("running effect for", key, "on", target);
    effect();
  });
}
