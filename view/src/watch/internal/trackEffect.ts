import context from "./context";
import getSubscriptions from "./getSubscriptions";

export default function trackEffect(target: Record<string, any>, key: string) {
  if (context.activeEffect) {
    const subscriptions = getSubscriptions(target, key);
    subscriptions.add(context.activeEffect);
  }
}
