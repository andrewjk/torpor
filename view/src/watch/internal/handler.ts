import $watch from "../$watch";
import { isProxySymbol, proxyTargetSymbol } from "./symbols";
import trackEffect from "./trackEffect";
import transferEffects from "./transferEffects";
import triggerEffects from "./triggerEffects";

// TODO: The rest of the stuff from ProxyHandler
// TODO: Cache property accesses?

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
    if (value && typeof value === "object" && !value[isProxySymbol] && !value.then) {
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
      if (oldValue && oldValue[isProxySymbol]) {
        newValue = $watch(value);
        transferEffects(oldValue, newValue);
      }

      // Set the property value on the target
      Reflect.set(target, prop, newValue, receiver);

      // Re-run effects
      triggerEffects(target, prop);
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
