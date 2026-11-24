import { PAGE_SCOPE_SYMBOL, newPageState } from "../state/scopedPage";
import type PageState from "../types/PageState";

interface PageStorage {
	getStore(): PageState | undefined;
	run<T>(store: PageState, fn: () => T): T;
}

// The resolved storage, once loaded. The value is cached rather than the
// import promise: on workerd a promise created in one request is left
// unsettled if that request ends first, and every later request awaiting it
// would hang (see `resolveModule` in serverHandlers). `import()` is
// module-cached, so concurrent cold requests each awaiting their own import
// cost nothing extra
let storage: PageStorage | null | undefined;
let warned = false;

async function loadStorage(): Promise<PageStorage | null> {
	if (storage !== undefined) return storage;
	try {
		// Imported lazily so that runtimes without `node:async_hooks` (a
		// Cloudflare worker without the `nodejs_als` or `nodejs_compat` flag)
		// can still load the server, falling back to shared page state
		const { AsyncLocalStorage } = await import("node:async_hooks");
		storage ??= new AsyncLocalStorage<PageState>();
	} catch {
		storage = null;
	}
	(globalThis as any)[PAGE_SCOPE_SYMBOL] = storage ?? undefined;
	return storage;
}

/**
 * Runs `fn` (the handling of one request) with its own `$page` state, so
 * that concurrent requests can't see each other's url, status, flash
 * message or form result.
 *
 * When the runtime has no `AsyncLocalStorage`, every request shares one
 * state, as it did before request scoping, and concurrent requests can
 * interfere -- so this warns once.
 */
export default async function runWithPageState<T>(fn: () => Promise<T>): Promise<T> {
	const pages = await loadStorage();
	if (pages === null) {
		if (!warned) {
			warned = true;
			console.warn(
				"[torpor] AsyncLocalStorage is not available, so $page is shared between " +
					"concurrent requests and one request can see another's url, flash message or " +
					'form result. On Cloudflare, add `compatibility_flags = ["nodejs_als"]` to ' +
					"your wrangler config.",
			);
		}
		return fn();
	}
	return pages.run(newPageState(), fn);
}
