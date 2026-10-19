/**
 * A promise-valued property of a route's load data. Deferred values are
 * streamed to the browser after the critical (non-promise) data, so a page can
 * render before they resolve.
 */
export type DeferredEntry = {
	/** The property path within the load's data object. */
	path: (string | number)[];
	promise: PromiseLike<unknown>;
};

/** The shape the client uses for a deferred entry's metadata. */
export type DeferredMeta = {
	/** An identifier unique within the response. */
	id: string;
	/** The index in `loads` (layout index, then the page). */
	index: number;
	/** The property path within that load's data object. */
	path: (string | number)[];
};

/**
 * A thenable is anything awaitable. Load data containing one is split into
 * critical data plus a deferred entry rather than being serialized as `{}`.
 */
export function isThenable(value: unknown): value is PromiseLike<unknown> {
	return (
		value !== null &&
		(typeof value === "object" || typeof value === "function") &&
		typeof (value as { then?: unknown }).then === "function"
	);
}

/**
 * Splits a load's data into the part that can be serialized immediately and
 * the promise-valued properties that should be streamed. Nested objects and
 * arrays are supported; the critical copy has `undefined` at each deferred
 * path (object keys are dropped by JSON.stringify, array slots become null).
 */
export function splitDeferred(value: unknown): {
	critical: unknown;
	entries: DeferredEntry[];
} {
	const entries: DeferredEntry[] = [];
	const critical = splitValue(value, [], entries);
	return { critical, entries };
}

function splitValue(value: unknown, path: (string | number)[], entries: DeferredEntry[]): unknown {
	if (isThenable(value)) {
		entries.push({ path, promise: value });
		return undefined;
	}
	if (Array.isArray(value)) {
		return value.map((item, index) => splitValue(item, [...path, index], entries));
	}
	if (isPlainObject(value)) {
		const result: Record<string, unknown> = {};
		for (const key of Object.keys(value)) {
			result[key] = splitValue(value[key], [...path, key], entries);
		}
		return result;
	}
	return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	if (value === null || typeof value !== "object") return false;
	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}

/**
 * Assigns a value at a property path, creating intermediate objects/arrays
 * when the critical JSON dropped them.
 */
export function setAtPath(target: object, path: (string | number)[], value: unknown): void {
	let current = target as Record<string | number, any>;
	for (let i = 0; i < path.length - 1; i++) {
		const key = path[i];
		if (current[key] === undefined || current[key] === null) {
			current[key] = typeof path[i + 1] === "number" ? [] : {};
		}
		current = current[key];
	}
	current[path[path.length - 1]] = value;
}

/**
 * JSON for embedding inside an inline `<script>`. `<` is escaped so a value
 * can't close the script or start a comment, and U+2028/U+2029 are escaped
 * because they are valid in JSON but line terminators in JavaScript.
 */
export function jsonForScript(value: unknown): string {
	const json = JSON.stringify(value);
	if (json === undefined) return "null";
	return json
		.replaceAll("<", "\\u003c")
		.replaceAll("\u2028", "\\u2028")
		.replaceAll("\u2029", "\\u2029");
}
