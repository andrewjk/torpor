// The client's ids, unique across the whole document (client navigations can
// keep a layout's components while re-rendering the page beneath them)
let nextId = 0;

// The server's ids, counted per render. Concurrent requests interleave, and
// a module counter would also give each request different ids than the ones
// its page hydrates with, so each render counts from 0 -- as the client does
// when it hydrates the page
const renders = new WeakMap<object, { next: number }>();

/**
 * Returns a unique ID for use by components that need one, e.g. for
 * accessibility.
 *
 * Pass the component's `$context`. On the server, ids are counted per render,
 * scoped by the per-request page state that `@torpor/build` passes to every
 * component as `$context.$page`, so each page renders the same ids every
 * time and they match the ones its components get when they hydrate.
 * Without it (e.g. rendering with `@torpor/view` directly) the server falls
 * back to one counter for the process.
 */
export default function getId($context?: Record<PropertyKey, any>): string {
	if (typeof document === "undefined") {
		const scope = $context?.$page;
		if (scope !== null && typeof scope === "object") {
			let counter = renders.get(scope);
			if (!counter) {
				counter = { next: 0 };
				renders.set(scope, counter);
			}
			return `torp-id-${counter.next++}`;
		}
	}
	return `torp-id-${nextId++}`;
}
