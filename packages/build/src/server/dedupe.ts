// The results of each request's deduped calls, keyed by the request so that
// they go when the request does. Loads, hooks and middleware all see the same
// Request object, whichever event they get
const results = new WeakMap<Request, Map<Function, Map<string, unknown>>>();

/**
 * Wraps a function so that it runs once per request for each set of
 * arguments: the root layout and the page can both call `getUser(event, id)`
 * and only hit the database once. Nothing is kept between requests, so the
 * data is never stale.
 *
 * ```ts
 * const getUser = dedupe((event, id: string) => db.users.find(id));
 *
 * // In any load, hook or action of the same request
 * const user = await getUser(event, id);
 * ```
 *
 * Arguments are compared by their JSON. A call that throws (or returns a
 * promise that rejects) isn't kept, so a later call can retry.
 *
 * @param fn The function to wrap. Its first argument is the event of the
 *   request (anything with a `request`), followed by its own arguments
 */
export default function dedupe<E extends { request: Request }, A extends unknown[], R>(
	fn: (event: E, ...args: A) => R,
): (event: E, ...args: A) => R {
	return (event: E, ...args: A): R => {
		let calls = results.get(event.request);
		if (!calls) {
			calls = new Map();
			results.set(event.request, calls);
		}
		let byArgs = calls.get(fn);
		if (!byArgs) {
			byArgs = new Map();
			calls.set(fn, byArgs);
		}
		const key = JSON.stringify(args);
		if (byArgs.has(key)) {
			return byArgs.get(key) as R;
		}
		const result = fn(event, ...args);
		byArgs.set(key, result);
		if (result instanceof Promise) {
			result.catch(() => {
				if (byArgs.get(key) === result) byArgs.delete(key);
			});
		}
		return result;
	};
}
