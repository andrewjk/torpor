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

/**
 * Signal key for a watched array's contents (element identity). Tracked by
 * anything whose result depends on which elements are at which indexes —
 * iteration, `slice`/`map`/`filter`/`find`/`indexOf`/`at`/`join`/… — and
 * propagated by direct index writes, which replace an element without
 * changing `length`. Kept separate from `length` so `items.length` readers
 * don't re-run (e.g. every list) just because one element was replaced.
 */
const proxyArrayContentSymbol: unique symbol = Symbol.for("torp.ProxyArrayContent");

export { proxyDataSymbol, proxyKeysSymbol, proxyArrayContentSymbol };
