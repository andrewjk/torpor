import { proxyTargetSymbol } from "./internal/symbols";

/**
 * Returns the target object of a proxy
 * @param object The proxy object
 */
export default function $unwrap<T extends Record<string | symbol, any>>(object: T): T {
  return object[proxyTargetSymbol] || object;
}
