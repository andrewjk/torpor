import type PageState from "../types/PageState";

/**
 * The `globalThis` slot holding the server's per-request page store (an
 * `AsyncLocalStorage<PageState>`, installed by `site/pageScope.ts`). Kept
 * out of this module so that it has no Node.js imports and can be bundled
 * for the client.
 */
export const PAGE_SCOPE_SYMBOL: unique symbol = Symbol.for("torp.PageScope");

interface PageScope {
	getStore(): PageState | undefined;
}

/** A fresh page state, as at the start of a request. */
export function newPageState(): PageState {
	return {
		status: 404,
		url: new URL("http://localhost"),
		form: undefined,
		flash: undefined,
		error: {
			message: "",
		},
	};
}

/**
 * Creates the server's `$page`: a proxy that reads and writes the page state
 * of the request currently being handled, so that concurrent requests (which
 * interleave at every `await`) can't see each other's url, flash message or
 * form result. Outside a request -- or when the runtime has no
 * `AsyncLocalStorage` -- it falls back to a single shared state.
 */
export function createScopedPage(): PageState {
	const fallback = newPageState();
	const current = (): Record<PropertyKey, any> =>
		((globalThis as any)[PAGE_SCOPE_SYMBOL] as PageScope | undefined)?.getStore() ?? fallback;

	return new Proxy({} as PageState, {
		get: (_target, key) => current()[key],
		set: (_target, key, value) => {
			current()[key] = value;
			return true;
		},
		deleteProperty: (_target, key) => delete current()[key],
		has: (_target, key) => key in current(),
		ownKeys: () => Reflect.ownKeys(current()),
		getOwnPropertyDescriptor: (_target, key) => {
			const descriptor = Reflect.getOwnPropertyDescriptor(current(), key);
			// The proxy's own target is empty, so every reported property
			// must be configurable to satisfy the proxy invariants
			if (descriptor) descriptor.configurable = true;
			return descriptor;
		},
	});
}
