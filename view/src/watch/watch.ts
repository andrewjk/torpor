import arrayHandler from "./internal/arrayHandler";
import handler from "./internal/handler";

/**
 * Watches an object for changes to its properties
 * @param object The object to watch
 */
export default function watch<T extends Record<string, any>>(object: T): T {
  // Return the object itself if it is undefined or null, or if it is already a proxy
  if (object == null || object.$isProxy) {
    return object;
  }

  // Wrap the object in a Proxy with a plain object or array handler
  const proxyHandler = Array.isArray(object) ? arrayHandler : handler;
  const proxy = new Proxy(object, proxyHandler);

  return proxy as T;
}
