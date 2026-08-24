import ClassValue from "../types/ClassValue";
import $unwrap from "../watch/$unwrap";

export default function buildClasses(value: ClassValue, styleHash?: string): string {
	if (typeof value === "string") {
		if (styleHash !== undefined) {
			value += " " + styleHash;
		}
		return value;
	} else {
		let classes: string[] = [];
		gatherClasses("", value, classes);
		if (styleHash !== undefined) {
			classes.push(styleHash);
		}
		return classes.join(" ");
	}
}

function gatherClasses(name: string, value: unknown, classes: string[]) {
	if (value) {
		// Unwrap watched values before iterating: component props are
		// deep-wrapped, and iterating a watched array disables the active
		// effect (see the array iterator in proxyGet), which would break
		// tracking of reads later in the same effect. Per-element tracking is
		// unnecessary here anyway -- the caller has already subscribed to the
		// property read that produced the value
		value = $unwrap(value as Record<PropertyKey, any>);
		if (Array.isArray(value)) {
			for (let v of value) {
				gatherClasses(v as string, v, classes);
			}
		} else if (typeof value === "object") {
			// Use `for-in` instead of `Object.entries(value)`. The entries
			// call allocates a new array (plus a [k, v] pair per entry) on
			// every invocation; `for-in` allocates nothing. Object literals
			// (the dominant case — e.g. `{ danger: bool }` in the row
			// template) have no inherited enumerable properties, so the two
			// are equivalent for our usage. This is on the per-effect re-run
			// hot path: a `select` op re-runs every row effect, each calling
			// `buildClasses({ danger: ... })`.
			for (const n in value) {
				gatherClasses(n, (value as Record<string, unknown>)[n], classes);
			}
		} else {
			classes.push(name);
		}
	}
}
