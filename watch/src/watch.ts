import handler from "./internal/handler";

type ProxyType = object & { $isProxy?: boolean };

/**
 * Watches an object for changes to its properties
 * @param object The object to watch
 */
export default function watch<T extends Record<string, any>>(object: T): T {
  // Return the object itself if it is undefined or null, or if it is already a proxy
  if (!object || object.$isProxy) {
    return object;
  }

  // Wrap the object in a Proxy
  const proxy = new Proxy(object, handler);

  // Set $isProxy so that we can know whether the object is already a proxy (as above)
  // and so that we can create nested proxies when an object property is accessed
  proxy.$isProxy = true;

  return proxy as T;
}
