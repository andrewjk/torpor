import type { NavigationResult } from "./navigate.ts";

/**
 * The detail of the `torpor:navigation-failed` window event.
 */
export type NavigationFailureDetail = {
	/** The url the navigation was headed to. */
	href: string;
	/** Why the page was kept: the network is unreachable. */
	reason: "offline";
	/** The failure that would have triggered the document fallback. */
	error?: unknown;
};

/** What the caller should do after a navigation rendered nothing. */
export type NavigationFallback = "document" | "kept";

/**
 * Decides what happens after a navigation rendered nothing.
 *
 * A failed navigation while offline can't be recovered by a document load
 * either (unless a service worker has that url cached), so the current page is
 * kept — often holding an unsaved form or an optimistic edit — and the app is
 * told through the cancelable `torpor:navigation-failed` `CustomEvent` on
 * `window`. Everything else takes the document fallback: by-design server
 * navigations (`+server` routes, redirects), and online failures such as a
 * stale chunk hash, which a reload fixes by picking up the new manifest.
 *
 * `navigator.onLine` only reports that the machine has a network interface,
 * not that the server is reachable, so it is used here as a hint (it decides
 * whether to keep the page, not whether the network works). The event carries
 * the caught error so an app can tell the cases apart.
 *
 * Returns `"document"` when the caller should navigate the document, and
 * `"kept"` when the page was left in place.
 */
export default function handleNavigationFailure(
	href: string,
	result: NavigationResult,
): NavigationFallback {
	if (result.type !== "failed" || navigator.onLine !== false) {
		return "document";
	}

	const event = new CustomEvent<NavigationFailureDetail>("torpor:navigation-failed", {
		cancelable: true,
		detail: { href, reason: "offline", error: result.error },
	});
	// An app that cancels the event (e.g. its service worker caches the target
	// shell) asks for the document navigation after all
	if (!window.dispatchEvent(event)) {
		return "document";
	}

	console.warn(
		`Navigation to ${href} failed while offline; staying on the current page. ` +
			"Listen for torpor:navigation-failed to show your own notice.",
	);
	return "kept";
}
