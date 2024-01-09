import watch from "../watch";
import trackEffect from "./trackEffect";
import triggerEffects from "./triggerEffects";

// TODO: The rest of the stuff from ProxyHandler
// TODO: Cache property accesses

// Adapted from https://stackoverflow.com/a/50723478
const handler = {
  get: function (target: Record<string, any>, key: string, receiver: any) {
    // Set the value to a new proxy if it's an object
    const value = target[key];
    if (value && !value.$isProxy && typeof value === "object") {
      target[key] = watch(value);
    }

    // If this property is being accessed in the course of setting up an effect, track it
    trackEffect(target, key);

    // Return the property value
    return Reflect.get(target, key, receiver);
  },
  set: function (target: Record<string, any>, key: string, value: any, receiver: any) {
    const oldValue = target[key];

    // Set the property value on the target
    // If the value was previously a proxy, watch the new value
    let newValue: any;
    if (oldValue && oldValue.$isProxy) {
      // TODO: Should we unsubscribe here?!
      newValue = watch(value);
    } else {
      newValue = value;
    }

    Reflect.set(target, key, value, receiver);

    // If the value has changed, re-run effects
    if (value !== oldValue) {
      triggerEffects(target, key);
    }

    return true;
  },
};

export default handler;
