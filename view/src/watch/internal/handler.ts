import watch from "../watch";
import trackEffect from "./trackEffect";
import triggerEffects from "./triggerEffects";
import updateEffects from "./updateEffects";

// TODO: The rest of the stuff from ProxyHandler
// TODO: Cache property accesses

// Adapted from https://stackoverflow.com/a/50723478
const handler = {
  get: function (target: Record<string | symbol, any>, prop: string | symbol, receiver: any) {
    if (prop === "$isProxy") {
      return true;
    }
    if (prop === "$target") {
      return target;
    }

    //console.log(`object get '${String(prop)}' on`, target);

    // Set the value to a new proxy if it's an object
    // But not if it's a Promise (i.e. has a `then` method)
    //let value = Reflect.get(target, prop, receiver);
    let value = target[prop];
    if (value && !value.$isProxy && typeof value === "object" && !value.then) {
      //Reflect.set(target, prop, watch(value), receiver);
      target[prop] = watch(value);
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
    //console.log(`object set '${String(prop)}' on`, target);

    //const oldValue = Reflect.get(target, prop, receiver);
    const oldValue = target[prop];

    // TODO: If setting an array we should trigger effects for each item, just in case their props have been changed

    // Only do things if the value has changed
    if (value !== oldValue) {
      // If the value was previously a proxy, watch the new value and update effect subscriptions
      let newValue = value;
      if (oldValue && oldValue.$isProxy) {
        newValue = watch(value);
        updateEffects(oldValue, value);
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
