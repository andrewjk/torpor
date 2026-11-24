/**
 * Whether `$watch`/`deepWrap` can proxy this value.
 *
 * Only plain objects, plain arrays, and exact Date/Map/Set instances are
 * deep-watched. Everything else -- class instances, array/collection
 * subclasses, RegExp, typed arrays, promises, DOM nodes, weak collections,
 * and any frozen/non-extensible object -- is treated as an opaque value: it
 * is returned unchanged, and only replacing the property that holds it is
 * reactive.
 */
export default function isWrappable(value: any): boolean {
	if (value === null || typeof value !== "object") return false;
	if (!Object.isExtensible(value)) return false;

	const proto = Object.getPrototypeOf(value);
	if (proto === Date.prototype || proto === Map.prototype || proto === Set.prototype) {
		return true;
	}
	// Plain objects/arrays only: subclasses can have their own methods or
	// private state, which a proxy would break
	return proto === Object.prototype || proto === null || proto === Array.prototype;
}
