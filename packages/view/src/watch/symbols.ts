const proxyDataSymbol: unique symbol = Symbol.for("torp.ProxyData");

/**
 * Signal key for a watched object's key-set membership (`ownKeys`). Tracked by
 * the proxy's `ownKeys` trap — so `Object.keys`/`values`/`entries`, spread,
 * `for…in` and `JSON.stringify` re-run when a key is added or deleted — and
 * propagated by the `set`/`deleteProperty` traps (and the array mutation
 * handles) when the key set actually changes. A Symbol so it can't collide
 * with a user property name.
 */
const proxyKeysSymbol: unique symbol = Symbol.for("torp.ProxyKeys");

export { proxyDataSymbol, proxyKeysSymbol };
