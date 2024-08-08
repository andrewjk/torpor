import $watch from "../$watch";
import { isProxySymbol, proxyTargetSymbol } from "./symbols";
import trackEffect from "./trackEffect";
import triggerEffects from "./triggerEffects";
import updateEffects from "./updateEffects";

// TODO: The rest of the stuff from ProxyHandler
// TODO: Cache property accesses

// Adapted from https://stackoverflow.com/a/50723478
const handler = {
  get: function (target: Record<string | symbol, any>, prop: string | symbol, receiver: any) {
    if (prop === isProxySymbol) {
      return true;
    }
    if (prop === proxyTargetSymbol) {
      return target;
    }

    //console.log(`object get '${String(prop)}' on`, target);

    // Set the value to a new proxy if it's an object
    // But not if it's a Promise (i.e. has a `then` method)
    let value = target[prop];
    if (value && !value[isProxySymbol] && typeof value === "object" && !value.then) {
      target[prop] = $watch(value);
    }

    // If this property is being accessed in the course of setting up an effect, track it
    // TODO: Only if it's a property and not a function?
    trackEffect(target, prop);

    // Return the property value
    return Reflect.get(target, prop, receiver);
  },
  set: function (
    target: Record<string | symbol, any>,
    prop: string | symbol,
    value: any,
    receiver: any,
  ) {
    //console.log(`object set '${String(prop)}' to '${value}' on`, target);

    const oldValue = target[prop];
    let newValue = value;

    // Only do things if the value has changed
    if (value !== oldValue) {
      // If the value was previously a proxy, watch the new value and update effect subscriptions
      let isProxy = oldValue && oldValue[isProxySymbol];
      if (isProxy) {
        newValue = $watch(value);
      }

      // Set the property value on the target
      Reflect.set(target, prop, newValue, receiver);

      // Re-run effects
      triggerEffects(target, prop);

      if (isProxy) {
        updateEffects(oldValue, newValue);
      }
    }

    return true;
  },
  /*
  apply: function (target: Function, thisArg: any, args: any[]): any {
    //console.log("APPLY?", target, thisArg);
    // TODO: re-run effects on the target
    return Reflect.apply(target, thisArg, args);
  },
  */
};

export default handler;
