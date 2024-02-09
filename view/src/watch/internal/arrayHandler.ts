/*
import watch from "../watch";

// From https://stackoverflow.com/a/50723478
const handler = {
  get: function (target: Record<string, any>, key: string) {
    // Get the property value from the target
    const value = target[key];

    // Return the property value if it is undefined or null
    if (value === undefined || value === null) {
      return value;
    }

    // Set the value to a new proxy if it's an object
    // HACK: Should probably be putting listeners somewhere nicer?
    if (!value.$isProxy && typeof value === "object" && key !== "__listeners") {
      target[key] = watch(value);
    }

    // From https://stackoverflow.com/a/54136394
    // NOTE: Should we have a special proxyArrayhandler to avoid doing this with every property check?
    // PERF: Because we know what methods are being called, we could potentially run them manually
    //       on DOM nodes (i.e. if it's a splice, we know which to remove and add etc)
    const listeners = target.__listeners;
    if (Array.isArray(target)) {
      if (
        key === "pop" ||
        key === "push" ||
        key === "reverse" ||
        key === "shift" ||
        key === "sort" ||
        key === "splice" ||
        key === "unshift"
      ) {
        // Get the array method
        const targetMethod: Function = target[key];

        // Run the array method
        return function (...args: any[]) {
          targetMethod.apply(target, args);

          // If this array has change functions, call them now
          // HACK: TypeScript complains about this...
          // const listeners = target.__listeners
          if (listeners["."]) {
            for (let i = 0; i < listeners["."].length; i++) {
              listeners["."][i](target);
            }
          }
        };
      }
    }

    return target[key];
  },
  set: function (target: Record<string, any>, key: string, value: any) {
    const old_value = target[key];

    // Set the property value on the target
    // If the value was already a proxy, watch the new value and store any listeners that have been set
    // TODO: store listeners recursively?
    if (old_value && old_value.$isProxy) {
      target[key] = watch(value);
      target[key].__listeners = old_value.__listeners;
    } else {
      target[key] = value;
    }

    // If the value has changed and this path has change functions, call them now
    if (value !== old_value) {
      const listeners = target.__listeners;
      if (listeners && listeners[key]) {
        for (let i = 0; i < listeners[key].length; i++) {
          listeners[key][i](value);
        }
      }
    }

    return true;
  },
};

export default handler;
*/
