import $watch from "../$watch";
import { isProxySymbol, proxyTargetSymbol } from "./symbols";
import trackEffect from "./trackEffect";
import transferEffects from "./transferEffects";
import triggerEffects from "./triggerEffects";

const arrayHandler = {
  get: function (target: Record<string | symbol, any>, prop: string | symbol, receiver: any) {
    if (prop === isProxySymbol) {
      return true;
    }
    if (prop === proxyTargetSymbol) {
      return target;
    }

    //console.log(`array get '${String(prop)}' on`, target);

    // Set the value to a new proxy if it's an object
    // TODO: Do we need to check if it's a Promise?
    const value = target[prop];
    if (value && !value[isProxySymbol] && typeof value === "object") {
      target[prop] = $watch(value);
    }

    // From https://stackoverflow.com/a/54136394
    // PERF: Because we know what methods are being called, we could potentially run them manually
    //       on DOM nodes (i.e. if it's a splice, we know which to remove and add etc)
    if (
      prop === "pop" ||
      prop === "push" ||
      prop === "reverse" ||
      prop === "shift" ||
      prop === "sort" ||
      prop === "splice" ||
      prop === "unshift"
    ) {
      // Get the array method
      const targetFunction: Function = target[prop];

      // Run the array method
      return function (...args: any[]) {
        targetFunction.apply(target, args);

        // If this array has change functions, call them now via the
        // length property, which gets accessed in most functions
        triggerEffects(target, "length");
      };
    } else if (prop === Symbol.iterator) {
      // Ignore the iterator
    } else {
      // If this property is being accessed in the course of setting up an effect, track it
      // TODO: Only if it's a property and not a function?
      trackEffect(target, prop);
    }

    // Return the property value
    return Reflect.get(target, prop, receiver);
  },
  set: function (
    target: Record<string | symbol, any>,
    prop: string | symbol,
    value: any,
    receiver: any,
  ) {
    //console.log(`array set '${String(prop)}' on`, target);

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
        transferEffects(oldValue, newValue);
      }
    }

    return true;
  },
};

export default arrayHandler;
